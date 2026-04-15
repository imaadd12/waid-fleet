const Driver = require("../models/driverModel");
const Vehicle = require("../models/vehicleModel");
const Billing = require("../models/billingModel");
const Trip = require("../models/tripModel");
const Incident = require("../models/incidentModel");
const Performance = require("../models/performanceModel");
const SupportTicket = require("../models/supportTicketModel");
const asyncHandler = require("express-async-handler");

/**
 * @desc    Get admin dashboard metrics
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
exports.getAdminDashboard = asyncHandler(async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // KPI CARDS
    const totalDrivers = await Driver.countDocuments();
    const activeDrivers = await Driver.countDocuments({ isActive: true });
    const verifiedDrivers = await Driver.countDocuments({ isVerified: true });
    const suspendedDrivers = await Driver.countDocuments({ isSuspended: true });

    const totalVehicles = await Vehicle.countDocuments();
    const activeVehicles = await Vehicle.countDocuments({ isActive: true });

    // TODAY'S METRICS
    const todayTrips = await Trip.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    const todayRevenue = todayTrips.reduce((sum, trip) => sum + (trip.fare || 0), 0);
    const todayCompletedTrips = todayTrips.filter(t => t.status === "completed").length;

    // MONTH'S METRICS
    const monthTrips = await Trip.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const monthRevenue = monthTrips.reduce((sum, trip) => sum + (trip.fare || 0), 0);
    const monthCompletion = monthTrips.length > 0 ? (monthTrips.filter(t => t.status === "completed").length / monthTrips.length) * 100 : 0;

    // BILLING METRICS
    const totalBilledAmount = await Billing.aggregate([
      { $group: { _id: null, total: { $sum: "$finalAmount" } } }
    ]);
    const totalCollected = await Billing.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPaid" } } }
    ]);

    // PERFORMANCE METRICS
    const avgRating = await Performance.aggregate([
      { $group: { _id: null, avgRating: { $avg: "$avgRating" } } }
    ]);

    // INCIDENTS
    const recentIncidents = await Incident.find({})
      .limit(10)
      .sort({ createdAt: -1 })
      .populate("driverId", "name phone");

    // SUPPORT TICKETS
    const openTickets = await SupportTicket.countDocuments({ status: { $ne: "resolved" } });
    const criticalTickets = await SupportTicket.countDocuments({ priority: "critical" });

    // PENDING VERIFICATIONS
    const pendingVerifications = await Driver.countDocuments({ isVerified: false });

    // ALERTS
    const overdueBills = await Billing.countDocuments({
      isOverdue: true,
      paymentStatus: { $ne: "paid" }
    });

    res.json({
      success: true,
      data: {
        kpis: {
          drivers: {
            total: totalDrivers,
            active: activeDrivers,
            verified: verifiedDrivers,
            suspended: suspendedDrivers,
            utilization: ((activeDrivers / totalDrivers) * 100).toFixed(2)
          },
          vehicles: {
            total: totalVehicles,
            active: activeVehicles,
            utilization: ((activeVehicles / totalVehicles) * 100).toFixed(2)
          },
          finance: {
            todayRevenue: todayRevenue.toFixed(2),
            monthRevenue: monthRevenue.toFixed(2),
            totalBilled: totalBilledAmount[0]?.total || 0,
            totalCollected: totalCollected[0]?.total || 0,
            collectionRate: (((totalCollected[0]?.total || 0) / (totalBilledAmount[0]?.total || 1)) * 100).toFixed(2)
          },
          operations: {
            todayTrips: todayCompletedTrips,
            totalTrips: monthTrips.length,
            completionRate: monthCompletion.toFixed(2),
            avgRating: (avgRating[0]?.avgRating || 0).toFixed(2)
          }
        },
        alerts: {
          pendingVerifications,
          overdueBills,
          openTickets,
          criticalTickets
        },
        recentActivity: {
          incidents: recentIncidents,
          openTickets: openTickets,
          criticalTickets: criticalTickets
        }
      }
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Get dashboard charts data
 * @route   GET /api/admin/dashboard/charts
 * @access  Private/Admin
 */
exports.getDashboardCharts = asyncHandler(async (req, res) => {
  try {
    // REVENUE TREND (Last 7 days)
    const revenueTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const dayRevenue = await Trip.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            status: "completed"
          }
        },
        { $group: { _id: null, total: { $sum: "$fare" } } }
      ]);

      revenueTrend.push({
        date: date.toDateString(),
        revenue: dayRevenue[0]?.total || 0
      });
    }

    // DRIVER STATUS DISTRIBUTION
    const driverDistribution = await Driver.aggregate([
      {
        $group: {
          _id: { isActive: "$isActive", isVerified: "$isVerified" },
          count: { $sum: 1 }
        }
      }
    ]);

    // TRIP STATUS DISTRIBUTION
    const tripDistribution = await Trip.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // PERFORMANCE BY RATING
    const ratingDistribution = await Performance.aggregate([
      {
        $bucket: {
          groupBy: "$avgRating",
          boundaries: [0, 2, 3, 4, 5],
          default: "No Rating",
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        revenueTrend,
        driverDistribution,
        tripDistribution,
        ratingDistribution
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Get pending alerts
 * @route   GET /api/admin/dashboard/alerts
 * @access  Private/Admin
 */
exports.getAlerts = asyncHandler(async (req, res) => {
  try {
    const alerts = [];

    // Pending verifications
    const pendingCount = await Driver.countDocuments({ isVerified: false });
    if (pendingCount > 0) {
      alerts.push({
        type: "pending_verifications",
        severity: "warning",
        message: `${pendingCount} drivers pending verification`,
        count: pendingCount,
        action: "/admin/users"
      });
    }

    // Overdue bills
    const overdueCount = await Billing.countDocuments({
      isOverdue: true,
      paymentStatus: { $ne: "paid" }
    });
    if (overdueCount > 0) {
      alerts.push({
        type: "overdue_bills",
        severity: "critical",
        message: `${overdueCount} overdue bills requiring attention`,
        count: overdueCount,
        action: "/admin/billing"
      });
    }

    // Critical support tickets
    const criticalTickets = await SupportTicket.countDocuments({
      priority: "critical",
      status: { $ne: "resolved" }
    });
    if (criticalTickets > 0) {
      alerts.push({
        type: "critical_tickets",
        severity: "critical",
        message: `${criticalTickets} critical support tickets open`,
        count: criticalTickets,
        action: "/admin/tickets"
      });
    }

    // Suspended drivers
    const suspendedCount = await Driver.countDocuments({ isSuspended: true });
    if (suspendedCount > 0) {
      alerts.push({
        type: "suspended_drivers",
        severity: "warning",
        message: `${suspendedCount} drivers currently suspended`,
        count: suspendedCount,
        action: "/admin/users"
      });
    }

    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
