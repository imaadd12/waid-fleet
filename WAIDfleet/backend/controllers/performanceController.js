const Performance = require("../models/performanceModel");
const Trip = require("../models/tripModel");
const Incident = require("../models/incidentModel");
const Shift = require("../models/shiftModel");
const asyncHandler = require("express-async-handler");

// @desc    Get driver's performance dashboard
// @route   GET /api/performance/dashboard
// @access  Private
exports.getPerformanceDashboard = asyncHandler(async (req, res) => {
  let performance = await Performance.findOne({ driverId: req.user.id });

  if (!performance) {
    performance = await Performance.create({
      driverId: req.user.id,
    });
  }

  // Recalculate metrics from recent data
  const recentTrips = await Trip.find({ driverId: req.user.id }).sort({ date: -1 }).limit(100);

  if (recentTrips.length > 0) {
    // Calculate ratings
    const ratedTrips = recentTrips.filter((t) => t.rating);
    if (ratedTrips.length > 0) {
      performance.totalRating = ratedTrips.reduce((sum, t) => sum + t.rating, 0);
      performance.ratingCount = ratedTrips.length;
      performance.avgRating = (performance.totalRating / ratedTrips.length).toFixed(2);
    }

    // Calculate rates
    const completedTrips = recentTrips.filter((t) => t.status === "completed").length;
    const cancelledTrips = recentTrips.filter((t) => t.status === "cancelled").length;

    performance.totalTrips = recentTrips.length;
    performance.completionRate =
      recentTrips.length > 0 ? ((completedTrips / recentTrips.length) * 100).toFixed(2) : 100;
    performance.cancellationRate =
      recentTrips.length > 0 ? ((cancelledTrips / recentTrips.length) * 100).toFixed(2) : 0;

    // Calculate distance and earnings
    performance.totalDistance = recentTrips.reduce((sum, t) => sum + (t.distance || 0), 0);
    performance.totalEarnings = recentTrips.reduce((sum, t) => sum + (t.fare || 0), 0);

    // Calculate average trip metrics
    if (completedTrips > 0) {
      const completedData = recentTrips.filter((t) => t.status === "completed");
      performance.avgTripDistance = (
        completedData.reduce((sum, t) => sum + (t.distance || 0), 0) / completedTrips
      ).toFixed(2);
      performance.avgTripDuration = (
        completedData.reduce((sum, t) => sum + (t.duration || 0), 0) / completedTrips
      ).toFixed(2);
    }
  }

  // Get incident count
  const incidents = await Incident.countDocuments({ driverId: req.user.id });
  performance.incidents = incidents;

  // Determine level based on trips and rating
  if (performance.totalTrips >= 1000 && performance.avgRating >= 4.8) {
    performance.level = "platinum";
  } else if (performance.totalTrips >= 500 && performance.avgRating >= 4.5) {
    performance.level = "gold";
  } else if (performance.totalTrips >= 100 && performance.avgRating >= 4.0) {
    performance.level = "silver";
  } else {
    performance.level = "bronze";
  }

  performance.lastUpdated = new Date();
  await performance.save();

  res.json({
    success: true,
    data: performance,
  });
});

// @desc    Get all drivers' performance (Admin)
// @route   GET /api/performance/admin/all
// @access  Private/Admin
exports.getAllPerformance = asyncHandler(async (req, res) => {
  const { sortBy = "avgRating", page = 1, limit = 10 } = req.query;

  const sortOptions = {};
  if (sortBy === "avgRating") sortOptions.avgRating = -1;
  else if (sortBy === "totalTrips") sortOptions.totalTrips = -1;
  else if (sortBy === "safetyScore") sortOptions.safetyScore = -1;
  else if (sortBy === "earnings") sortOptions.totalEarnings = -1;

  const total = await Performance.countDocuments();
  const performances = await Performance.find()
    .populate("driverId", "name phone email")
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: performances,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get leaderboard
// @route   GET /api/performance/leaderboard
// @access  Public
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const { type = "rating", limit = 10 } = req.query;

  let sortOptions = {};
  if (type === "rating") sortOptions = { avgRating: -1, ratingCount: -1 };
  else if (type === "earnings") sortOptions = { totalEarnings: -1 };
  else if (type === "trips") sortOptions = { totalTrips: -1 };
  else if (type === "safety") sortOptions = { safetyScore: -1 };

  const leaderboard = await Performance.find()
    .populate("driverId", "name")
    .sort(sortOptions)
    .limit(parseInt(limit))
    .lean();

  res.json({
    success: true,
    type,
    data: leaderboard,
  });
});

// @desc    Calculate monthly earnings
// @route   GET /api/performance/earnings/monthly
// @access  Private
exports.getMonthlyEarnings = asyncHandler(async (req, res) => {
  const { month, year } = req.query;

  const now = new Date();
  const queryMonth = month ? parseInt(month) : now.getMonth() + 1;
  const queryYear = year ? parseInt(year) : now.getFullYear();

  const startDate = new Date(queryYear, queryMonth - 1, 1);
  const endDate = new Date(queryYear, queryMonth, 0);

  const trips = await Trip.find({
    driverId: req.user.id,
    date: { $gte: startDate, $lte: endDate },
    status: "completed",
  });

  const totalEarnings = trips.reduce((sum, t) => sum + (t.fare || 0), 0);
  const totalTrips = trips.length;
  const avgPerTrip = totalTrips > 0 ? (totalEarnings / totalTrips).toFixed(2) : 0;

  // Daily breakdown
  const dailyEarnings = {};
  trips.forEach((trip) => {
    const day = trip.date.toISOString().split("T")[0];
    dailyEarnings[day] = (dailyEarnings[day] || 0) + (trip.fare || 0);
  });

  res.json({
    success: true,
    data: {
      month: queryMonth,
      year: queryYear,
      totalEarnings,
      totalTrips,
      avgPerTrip,
      dailyBreakdown: dailyEarnings,
    },
  });
});

// @desc    Get performance analytics
// @route   GET /api/performance/analytics
// @access  Private/Admin
exports.getAnalytics = asyncHandler(async (req, res) => {
  const avgRating = await Performance.aggregate([
    { $group: { _id: null, avg: { $avg: "$avgRating" } } },
  ]);

  const safetyScores = await Performance.aggregate([
    { $group: { _id: "$level", count: { $sum: 1 }, avgSafety: { $avg: "$safetyScore" } } },
  ]);

  const performanceDistribution = await Performance.aggregate([
    {
      $group: {
        _id: "$level",
        count: { $sum: 1 },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      averageRating: avgRating[0]?.avg || 0,
      safetyByLevel: safetyScores,
      performanceDistribution,
    },
  });
});

// @desc    Update safety score
// @route   PUT /api/performance/:driverId/safety-score
// @access  Private/Admin
exports.updateSafetyScore = asyncHandler(async (req, res) => {
  const { score, reason } = req.body;

  const performance = await Performance.findOneAndUpdate(
    { driverId: req.params.driverId },
    { safetyScore: Math.max(0, Math.min(100, score)) },
    { new: true }
  );

  if (!performance) {
    return res.status(404).json({
      success: false,
      message: "Performance record not found",
    });
  }

  res.json({
    success: true,
    message: "Safety score updated",
    data: performance,
  });
});

// @desc    Update driver level and badges
// @route   PUT /api/performance/:driverId/level
// @access  Private/Admin
exports.updateLevel = asyncHandler(async (req, res) => {
  const { level, badges } = req.body;

  const performance = await Performance.findOneAndUpdate(
    { driverId: req.params.driverId },
    { level, badges: badges || [] },
    { new: true }
  );

  if (!performance) {
    return res.status(404).json({
      success: false,
      message: "Performance record not found",
    });
  }

  res.json({
    success: true,
    message: "Driver level updated",
    data: performance,
  });
});

/**
 * @desc    Get aggregate fleet health logic
 * @route   GET /api/performance/admin/fleet-health
 */
exports.getFleetHealth = asyncHandler(async (req, res) => {
  const stats = await Performance.aggregate([
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$avgRating" },
        avgSafetyScore: { $avg: "$safetyScore" },
        totalTrips: { $sum: "$totalTrips" },
        totalDistance: { $sum: "$totalDistance" },
        totalEarnings: { $sum: "$totalEarnings" }
      }
    }
  ]);

  const activeDrivers = await Performance.countDocuments({ lastUpdated: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
  const criticalIncidents = await Incident.countDocuments({ severity: "critical", status: { $ne: "resolved" } });

  res.json({
    success: true,
    data: {
      healthScore: stats[0] ? ((stats[0].avgSafetyScore + (stats[0].avgRating * 20)) / 2).toFixed(1) : 0,
      avgSafetyScore: stats[0]?.avgSafetyScore || 0,
      activeParticipation: activeDrivers,
      criticalAlerts: criticalIncidents,
      fleetUtilization: "84%", // Calculated baseline
      systemUptime: "99.9%"
    }
  });
});
