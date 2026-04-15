const Driver = require("../models/driverModel");
const Trip = require("../models/tripModel");
const Billing = require("../models/billingModel");
const Vehicle = require("../models/vehicleModel");

// Get revenue trends (daily, weekly, monthly)
const getRevenueTrends = async (req, res) => {
  try {
    const { period = 'weekly' } = req.query; // daily, weekly, monthly
    const today = new Date();
    let startDate = new Date();
    let groupBy = '%d'; // daily

    if (period === 'weekly') {
      startDate.setDate(today.getDate() - 30); // Last 30 days for weekly view
      groupBy = '%U'; // week
    } else if (period === 'monthly') {
      startDate.setMonth(today.getMonth() - 12); // Last 12 months
      groupBy = '%m'; // month
    } else {
      startDate.setDate(today.getDate() - 7); // Last 7 days
    }

    startDate.setHours(0, 0, 0, 0);

    // Get trips for the period
    const trips = await Trip.find({
      date: { $gte: startDate, $lte: today },
      status: 'completed'
    }).lean();

    // Group trips by date
    const trends = {};
    trips.forEach(trip => {
      const date = new Date(trip.date);
      let key;
      
      if (period === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = date.toISOString().substring(0, 7); // YYYY-MM
      }

      if (!trends[key]) {
        trends[key] = { earning: 0, trips: 0 };
      }
      trends[key].earning += trip.fare;
      trends[key].trips += 1;
    });

    // Convert to array and sort
    const data = Object.entries(trends).map(([date, data]) => ({
      date,
      ...data
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      success: true,
      data,
      period
    });

  } catch (error) {
    console.error("Error getting revenue trends:", error);
    res.status(500).json({
      success: false,
      message: "Error getting revenue trends",
      error: error.message
    });
  }
};

// Get trip distribution
const getTripDistribution = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get trips for current month
    const trips = await Trip.find({
      date: { $gte: startOfMonth, $lte: today },
      status: 'completed'
    }).lean();

    // Categorize trips (can be customized based on fare amount)
    const distribution = {
      'Short (< ₹200)': 0,
      'Medium (₹200-₹500)': 0,
      'Long (₹500-₹1000)': 0,
      'Premium (> ₹1000)': 0
    };

    trips.forEach(trip => {
      if (trip.fare < 200) {
        distribution['Short (< ₹200)']++;
      } else if (trip.fare < 500) {
        distribution['Medium (₹200-₹500)']++;
      } else if (trip.fare < 1000) {
        distribution['Long (₹500-₹1000)']++;
      } else {
        distribution['Premium (> ₹1000)']++;
      }
    });

    const data = Object.entries(distribution).map(([category, count]) => ({
      name: category,
      value: count,
      percentage: trips.length > 0 ? ((count / trips.length) * 100).toFixed(2) : 0
    }));

    res.status(200).json({
      success: true,
      data,
      totalTrips: trips.length
    });

  } catch (error) {
    console.error("Error getting trip distribution:", error);
    res.status(500).json({
      success: false,
      message: "Error getting trip distribution",
      error: error.message
    });
  }
};

// Get top earners
const getTopEarners = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Get trips grouped by driver
    const trips = await Trip.find({
      date: { $gte: startOfWeek, $lte: today },
      status: 'completed'
    }).lean();

    // Calculate earnings per driver
    const driverEarnings = {};
    trips.forEach(trip => {
      if (!driverEarnings[trip.driverId]) {
        driverEarnings[trip.driverId] = {
          driverId: trip.driverId,
          earning: 0,
          trips: 0
        };
      }
      driverEarnings[trip.driverId].earning += trip.fare;
      driverEarnings[trip.driverId].trips += 1;
    });

    // Get driver details and sort
    const topEarners = await Promise.all(
      Object.values(driverEarnings)
        .sort((a, b) => b.earning - a.earning)
        .slice(0, limit)
        .map(async (item) => {
          const driver = await Driver.findById(item.driverId).select('name phone email -password');
          return {
            ...item,
            driver: driver
          };
        })
    );

    res.status(200).json({
      success: true,
      data: topEarners
    });

  } catch (error) {
    console.error("Error getting top earners:", error);
    res.status(500).json({
      success: false,
      message: "Error getting top earners",
      error: error.message
    });
  }
};

// Get vehicle utilization
const getVehicleUtilization = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get all vehicles
    const vehicles = await Vehicle.find().lean();

    // Get trips per vehicle
    const vehicleTrips = await Trip.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: today },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$vehicleId',
          tripCount: { $sum: 1 },
          totalEarning: { $sum: '$fare' }
        }
      }
    ]);

    // Create vehicle utilization data
    const utilization = vehicles.map(vehicle => {
      const tripData = vehicleTrips.find(t => t._id.toString() === vehicle._id.toString());
      return {
        vehicleName: vehicle.name,
        plateNumber: vehicle.plateNumber,
        tripCount: tripData?.tripCount || 0,
        totalEarning: tripData?.totalEarning || 0,
        utilizationPercentage: tripData?.tripCount ? ((tripData.tripCount / vehicleTrips.reduce((sum, t) => sum + t.tripCount, 0)) * 100).toFixed(2) : 0
      };
    }).sort((a, b) => b.tripCount - a.tripCount);

    res.status(200).json({
      success: true,
      data: utilization,
      period: `${startOfMonth.toLocaleDateString()} - ${today.toLocaleDateString()}`
    });

  } catch (error) {
    console.error("Error getting vehicle utilization:", error);
    res.status(500).json({
      success: false,
      message: "Error getting vehicle utilization",
      error: error.message
    });
  }
};

// Get driver status overview (active vs inactive)
const getDriverStatusOverview = async (req, res) => {
  try {
    const today = new Date();
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all drivers
    const totalDrivers = await Driver.countDocuments();
    const activeDrivers = await Driver.countDocuments({ isActive: true });
    const inactiveDrivers = totalDrivers - activeDrivers;

    // Get active drivers in last 7 days
    const activeInLastWeek = await Trip.distinct('driverId', {
      date: { $gte: last7Days, $lte: today },
      status: 'completed'
    });

    // Calculate daily active drivers
    const dailyActiveDrivers = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const count = await Trip.distinct('driverId', {
        date: { $gte: date, $lt: nextDate },
        status: 'completed'
      });

      dailyActiveDrivers.push({
        date: date.toISOString().split('T')[0],
        activeCount: count.length
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalDrivers,
        activeDrivers,
        inactiveDrivers,
        activeInLastWeek: activeInLastWeek.length,
        dailyActiveDrivers
      }
    });

  } catch (error) {
    console.error("Error getting driver status overview:", error);
    res.status(500).json({
      success: false,
      message: "Error getting driver status overview",
      error: error.message
    });
  }
};

// Get comprehensive analytics dashboard
const getDashboardAnalytics = async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Total stats
    const totalTrips = await Trip.countDocuments({
      date: { $gte: startOfWeek, $lte: today },
      status: 'completed'
    });

    const totalEarning = await Trip.aggregate([
      {
        $match: {
          date: { $gte: startOfWeek, $lte: today },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$fare' }
        }
      }
    ]);

    const totalToll = await Trip.aggregate([
      {
        $match: {
          date: { $gte: startOfWeek, $lte: today },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$toll' }
        }
      }
    ]);

    const activeDrivers = await Driver.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      data: {
        thisWeek: {
          totalTrips,
          totalEarning: totalEarning[0]?.total || 0,
          totalToll: totalToll[0]?.total || 0,
          activeDrivers
        },
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Error getting dashboard analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error getting dashboard analytics",
      error: error.message
    });
  }
};

module.exports = {
  getRevenueTrends,
  getTripDistribution,
  getTopEarners,
  getVehicleUtilization,
  getDriverStatusOverview,
  getDashboardAnalytics
};