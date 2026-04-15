const Performance = require("../models/performanceModel");
const Trip = require("../models/tripModel");
const Incident = require("../models/incidentModel");
const Driver = require("../models/driverModel");
const asyncHandler = require("express-async-handler");

// ==================== DASHBOARD & OVERVIEW ====================
/**
 * @desc    Get driver's complete performance dashboard
 * @route   GET /api/performance/dashboard/:driverId
 * @access  Private
 */
exports.getPerformanceDashboard = asyncHandler(async (req, res) => {
  const { driverId } = req.params;

  let performance = await Performance.findOne({ driverId }).populate("driverId", "name email phone");

  if (!performance) {
    performance = await Performance.create({ driverId });
  }

  // Recalculate all metrics from recent data
  const recentTrips = await Trip.find({ driverId }).sort({ createdAt: -1 }).limit(500);

  if (recentTrips.length > 0) {
    // ========== UPDATE TRIP STATS ==========
    const completedTrips = recentTrips.filter(t => t.status === "completed");
    const cancelledTrips = recentTrips.filter(t => t.status === "cancelled");
    const noShowTrips = recentTrips.filter(t => t.status === "no-show");
    const ratedTrips = recentTrips.filter(t => t.rating);

    performance.totalTrips = recentTrips.length;
    performance.completedTrips = completedTrips.length;
    performance.cancelledTrips = cancelledTrips.length;
    performance.noShowTrips = noShowTrips.length;
    performance.completionRate = ((completedTrips.length / recentTrips.length) * 100).toFixed(2);
    performance.cancellationRate = ((cancelledTrips.length / recentTrips.length) * 100).toFixed(2);
    performance.noShowRate = ((noShowTrips.length / recentTrips.length) * 100).toFixed(2);

    // ========== UPDATE RATINGS ==========
    if (ratedTrips.length > 0) {
      const ratings = ratedTrips.map(t => t.rating);
      performance.totalRating = ratings.reduce((a, b) => a + b, 0);
      performance.ratingCount = ratedTrips.length;
      performance.avgRating = (performance.totalRating / ratedTrips.length).toFixed(2);

      // Rating breakdown
      performance.fiveStarCount = ratedTrips.filter(t => t.rating === 5).length;
      performance.fourStarCount = ratedTrips.filter(t => t.rating === 4).length;
      performance.threeStarCount = ratedTrips.filter(t => t.rating === 3).length;
      performance.twoStarCount = ratedTrips.filter(t => t.rating === 2).length;
      performance.oneStarCount = ratedTrips.filter(t => t.rating === 1).length;
    }

    // ========== UPDATE EARNINGS ==========
    performance.totalEarnings = completedTrips.reduce((sum, t) => sum + (t.fare || 0), 0);
    performance.avgEarningsPerTrip = performance.totalEarnings / (completedTrips.length || 1);
    
    // ========== UPDATE OPERATIONAL METRICS ==========
    performance.totalDistance = recentTrips.reduce((sum, t) => sum + (t.distance || 0), 0);
    performance.totalHours = recentTrips.reduce((sum, t) => sum + (t.duration || 0), 0) / 60; // convert to hours
    performance.avgTripDistance = (performance.totalDistance / recentTrips.length).toFixed(2);
    performance.avgTripDuration = (recentTrips.reduce((sum, t) => sum + (t.duration || 0), 0) / recentTrips.length).toFixed(0);
    performance.avgSpeed = performance.totalHours > 0 ? (performance.totalDistance / performance.totalHours).toFixed(2) : 0;
    performance.tripsPerDay = (recentTrips.length / 30).toFixed(2); // estimate
  }

  // ========== UPDATE INCIDENTS & SAFETY ==========
  const incidents = await Incident.find({ driverId }).limit(50);
  performance.incidents = incidents.length;
  performance.speedingViolations = incidents.filter(i => i.type === "speeding").length;
  performance.hardBrakingCount = incidents.filter(i => i.type === "hard_braking").length;
  performance.accidentCount = incidents.filter(i => i.type === "accident").length;
  
  // Calculate safety score
  const violationPenalty = (performance.violations * 5) + (performance.incidents * 10);
  performance.safetyScore = Math.max(0, 100 - violationPenalty);

  // ========== UPDATE TIER LEVEL ==========
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

  res.json({ success: true, data: performance });
});

// ==================== RATINGS & REVIEWS ====================
/**
 * @desc    Get rating distribution breakdown
 * @route   GET /api/performance/ratings/:driverId
 * @access  Private
 */
exports.getRatingBreakdown = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const performance = await Performance.findOne({ driverId });

  if (!performance) {
    return res.status(404).json({ success: false, message: "Performance data not found" });
  }

  const total = performance.ratingCount || 1;
  const breakdown = {
    avgRating: performance.avgRating,
    totalReviews: performance.ratingCount,
    distribution: {
      fiveStars: { count: performance.fiveStarCount, percentage: ((performance.fiveStarCount / total) * 100).toFixed(1) },
      fourStars: { count: performance.fourStarCount, percentage: ((performance.fourStarCount / total) * 100).toFixed(1) },
      threeStars: { count: performance.threeStarCount, percentage: ((performance.threeStarCount / total) * 100).toFixed(1) },
      twoStars: { count: performance.twoStarCount, percentage: ((performance.twoStarCount / total) * 100).toFixed(1) },
      oneStars: { count: performance.oneStarCount, percentage: ((performance.oneStarCount / total) * 100).toFixed(1) }
    }
  };

  res.json({ success: true, data: breakdown });
});

/**
 * @desc    Get recent reviews/ratings for a driver
 * @route   GET /api/performance/reviews/:driverId
 * @access  Private
 */
exports.getRecentReviews = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const { limit = 20, page = 1 } = req.query;

  const trips = await Trip.find({ driverId, rating: { $exists: true, $ne: null } })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .select("rating feedback date pickup dropoff fare");

  const total = await Trip.countDocuments({ driverId, rating: { $exists: true, $ne: null } });

  res.json({
    success: true,
    data: trips,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  });
});

// ==================== ANALYTICS & TRENDS ====================
/**
 * @desc    Get performance trends (weekly/monthly)
 * @route   GET /api/performance/trends/:driverId
 * @access  Private
 */
exports.getPerformanceTrends = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const { timeframe = "monthly" } = req.query; // weekly or monthly

  const performance = await Performance.findOne({ driverId });

  const metrics = timeframe === "weekly" 
    ? performance.weeklyMetrics.slice(-12) 
    : performance.monthlyMetrics.slice(-12);

  res.json({ success: true, timeframe, data: metrics });
});

/**
 * @desc    Calculate and get hourly performance patterns
 * @route   GET /api/performance/hourly/:driverId
 * @access  Private
 */
exports.getHourlyAnalytics = asyncHandler(async (req, res) => {
  const { driverId } = req.params;

  const trips = await Trip.find({ driverId, status: "completed" }).limit(1000);
  
  const hourlyData = {};
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = { trips: 0, earnings: 0, avgRating: 0, ratingCount: 0 };
  }

  trips.forEach(trip => {
    const hour = new Date(trip.createdAt).getHours();
    hourlyData[hour].trips += 1;
    hourlyData[hour].earnings += trip.fare || 0;
    if (trip.rating) {
      hourlyData[hour].avgRating += trip.rating;
      hourlyData[hour].ratingCount += 1;
    }
  });

  // Calculate averages
  Object.keys(hourlyData).forEach(hour => {
    if (hourlyData[hour].ratingCount > 0) {
      hourlyData[hour].avgRating = (hourlyData[hour].avgRating / hourlyData[hour].ratingCount).toFixed(2);
    }
  });

  res.json({ success: true, data: hourlyData });
});

/**
 * @desc    Get day-of-week patterns
 * @route   GET /api/performance/weekly-patterns/:driverId
 * @access  Private
 */
exports.getWeeklyPatterns = asyncHandler(async (req, res) => {
  const { driverId } = req.params;

  const trips = await Trip.find({ driverId, status: "completed" }).limit(1000);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayData = {};
  
  dayNames.forEach((day, index) => {
    dayData[day] = { trips: 0, earnings: 0, avgRating: 0, ratingCount: 0 };
  });

  trips.forEach(trip => {
    const day = dayNames[new Date(trip.createdAt).getDay()];
    dayData[day].trips += 1;
    dayData[day].earnings += trip.fare || 0;
    if (trip.rating) {
      dayData[day].avgRating += trip.rating;
      dayData[day].ratingCount += 1;
    }
  });

  Object.keys(dayData).forEach(day => {
    if (dayData[day].ratingCount > 0) {
      dayData[day].avgRating = (dayData[day].avgRating / dayData[day].ratingCount).toFixed(2);
    }
  });

  res.json({ success: true, data: dayData });
});

// ==================== SAFETY & COMPLIANCE ====================
/**
 * @desc    Get incident details and history
 * @route   GET /api/performance/incidents/:driverId
 * @access  Private
 */
exports.getIncidentHistory = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const { limit = 50, page = 1 } = req.query;

  const incidents = await Incident.find({ driverId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Incident.countDocuments({ driverId });

  const stats = {
    total,
    byType: {
      speeding: incidents.filter(i => i.type === "speeding").length,
      hardBraking: incidents.filter(i => i.type === "hard_braking").length,
      accidents: incidents.filter(i => i.type === "accident").length,
      violation: incidents.filter(i => i.type === "violation").length
    }
  };

  res.json({
    success: true,
    incidents,
    stats,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
  });
});

/**
 * @desc    Get safety score details
 * @route   GET /api/performance/safety/:driverId
 * @access  Private
 */
exports.getSafetyDetails = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const performance = await Performance.findOne({ driverId });

  if (!performance) {
    return res.status(404).json({ success: false, message: "Performance data not found" });
  }

  const safetyDetails = {
    safetyScore: performance.safetyScore,
    violations: performance.violations,
    speedingViolations: performance.speedingViolations,
    incidents: performance.incidents,
    hardBrakingCount: performance.hardBrakingCount,
    accidentCount: performance.accidentCount,
    scoreBreakdown: {
      trafficViolations: performance.violations * 5,
      incidents: performance.incidents * 10,
      currentScore: performance.safetyScore
    },
    recommendations: performance.safetyScore < 80 ? [
      "Review traffic rules and regulations",
      "Take a defensive driving course",
      "Reduce speeding violations",
      "Practice smoother braking"
    ] : ["Excellent safety record! Keep it up!"]
  };

  res.json({ success: true, data: safetyDetails });
});

// ==================== EARNINGS & INCENTIVES ====================
/**
 * @desc    Get detailed earnings breakdown
 * @route   GET /api/performance/earnings/:driverId
 * @access  Private
 */
exports.getEarningsBreakdown = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const performance = await Performance.findOne({ driverId });

  if (!performance) {
    return res.status(404).json({ success: false, message: "Performance data not found" });
  }

  const breakdown = {
    totalEarnings: performance.totalEarnings,
    avgPerTrip: performance.avgEarningsPerTrip,
    avgPerHour: performance.avgEarningsPerHour,
    weeklyEarnings: performance.weeklyEarnings,
    monthlyEarnings: performance.monthlyEarnings,
    breakdown: {
      baseEarnings: performance.baseEarnings,
      bonusEarnings: performance.bonusEarnings,
      incentiveEarnings: performance.incentiveEarnings
    },
    projection: {
      weeklyProjection: (performance.avgEarningsPerTrip * (performance.tripsPerDay * 7)).toFixed(2),
      monthlyProjection: (performance.avgEarningsPerTrip * (performance.tripsPerDay * 30)).toFixed(2)
    }
  };

  res.json({ success: true, data: breakdown });
});

/**
 * @desc    Get earnings history with monthly breakdown
 * @route   GET /api/performance/earnings-history/:driverId
 * @access  Private
 */
exports.getEarningsHistory = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const performance = await Performance.findOne({ driverId });

  const history = performance.monthlyMetrics.map(m => ({
    month: `${m.month}/${m.year}`,
    earnings: m.earnings,
    trips: m.trips,
    avgRating: m.avgRating
  }));

  res.json({ success: true, data: history });
});

// ==================== GOALS & TARGETS ====================
/**
 * @desc    Create a new performance goal
 * @route   POST /api/performance/goals/:driverId
 * @access  Private
 */
exports.createGoal = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const { type, targetValue, deadline, reward } = req.body;

  const performance = await Performance.findOne({ driverId });

  if (!performance) {
    return res.status(404).json({ success: false, message: "Performance data not found" });
  }

  performance.goals.push({
    type,
    targetValue,
    currentValue: 0,
    deadline: new Date(deadline),
    reward: reward || 0,
    completed: false
  });

  await performance.save();

  res.json({ success: true, message: "Goal created", data: performance.goals });
});

/**
 * @desc    Get all driver goals
 * @route   GET /api/performance/goals/:driverId
 * @access  Private
 */
exports.getGoals = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const performance = await Performance.findOne({ driverId });

  if (!performance) {
    return res.status(404).json({ success: false, message: "Performance data not found" });
  }

  const goals = performance.goals.sort((a, b) => a.deadline - b.deadline);

  res.json({ success: true, data: goals });
});

/**
 * @desc    Update goal progress
 * @route   PUT /api/performance/goals/:driverId/:goalId
 * @access  Private
 */
exports.updateGoalProgress = asyncHandler(async (req, res) => {
  const { driverId, goalId } = req.params;
  const { currentValue } = req.body;

  const performance = await Performance.findOne({ driverId });
  const goal = performance.goals.id(goalId);

  if (!goal) {
    return res.status(404).json({ success: false, message: "Goal not found" });
  }

  goal.currentValue = currentValue;
  if (currentValue >= goal.targetValue) {
    goal.completed = true;
    performance.totalPoints += goal.reward;
  }

  await performance.save();

  res.json({ success: true, message: "Goal updated", data: goal });
});

// ==================== ALERTS & WARNINGS ====================
/**
 * @desc    Get active alerts
 * @route   GET /api/performance/alerts/:driverId
 * @access  Private
 */
exports.getAlerts = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const { includeRead = false } = req.query;

  const performance = await Performance.findOne({ driverId });

  if (!performance) {
    return res.status(404).json({ success: false, message: "Performance data not found" });
  }

  let alerts = performance.alerts;
  if (!includeRead) {
    alerts = alerts.filter(a => !a.read);
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  res.json({ success: true, data: alerts });
});

/**
 * @desc    Mark alert as read
 * @route   PUT /api/performance/alerts/:driverId/:alertId
 * @access  Private
 */
exports.markAlertAsRead = asyncHandler(async (req, res) => {
  const { driverId, alertId } = req.params;

  const performance = await Performance.findOne({ driverId });
  const alert = performance.alerts.id(alertId);

  if (!alert) {
    return res.status(404).json({ success: false, message: "Alert not found" });
  }

  alert.read = true;
  await performance.save();

  res.json({ success: true, message: "Alert marked as read" });
});

/**
 * @desc    Generate performance alerts automatically
 * @route   GET /api/performance/generate-alerts/:driverId
 * @access  Private/Admin
 */
exports.generateAlerts = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const performance = await Performance.findOne({ driverId });

  if (!performance) {
    return res.status(404).json({ success: false, message: "Performance data not found" });
  }

  // Clear old alerts
  performance.alerts = [];

  // Generate new alerts based on current metrics
  if (performance.avgRating < 3.5) {
    performance.alerts.push({
      type: "low_rating",
      severity: "high",
      message: `Your rating has dropped to ${performance.avgRating}. Please focus on service quality.`,
      read: false
    });
  }

  if (performance.cancellationRate > 15) {
    performance.alerts.push({
      type: "high_cancellation",
      severity: "medium",
      message: `Your cancellation rate (${performance.cancellationRate}%) is above acceptable levels.`,
      read: false
    });
  }

  if (performance.safetyScore < 80) {
    performance.alerts.push({
      type: "low_safety",
      severity: "critical",
      message: `Your safety score is critically low (${performance.safetyScore}). Immediate action required.`,
      read: false
    });
  }

  if (performance.completionRate < 90) {
    performance.alerts.push({
      type: "low_completion",
      severity: "medium",
      message: `Your completion rate needs improvement (${performance.completionRate}%).`,
      read: false
    });
  }

  if (performance.totalTrips < 10) {
    performance.alerts.push({
      type: "few_trips",
      severity: "low",
      message: "You haven't completed many trips yet. Get more experience!",
      read: false
    });
  }

  await performance.save();

  res.json({ success: true, data: performance.alerts });
});

// ==================== ACHIEVEMENTS & BADGES ====================
/**
 * @desc    Get all earned badges
 * @route   GET /api/performance/badges/:driverId
 * @access  Private
 */
exports.getBadges = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const performance = await Performance.findOne({ driverId });

  if (!performance) {
    return res.status(404).json({ success: false, message: "Performance data not found" });
  }

  const availableBadges = [
    { name: "100_trips", description: "Completed 100 trips", requirement: "totalTrips >= 100" },
    { name: "500_trips", description: "Completed 500 trips", requirement: "totalTrips >= 500" },
    { name: "1000_trips", description: "Completed 1000 trips", requirement: "totalTrips >= 1000" },
    { name: "5_star_rating", description: "Maintained 5-star rating", requirement: "avgRating >= 5" },
    { name: "4_5_rating", description: "Maintained 4.5+ rating for 50 trips", requirement: "avgRating >= 4.5" },
    { name: "perfect_safety", description: "Zero incidents for 100 trips", requirement: "incidents === 0" },
    { name: "punctuality_champion", description: "99% on-time delivery", requirement: "onTimeDeliveryRate >= 99" },
    { name: "consistency", description: "Perfect rating streak of 30 days", requirement: "streak >= 30" },
    { name: "earnings_milestone", description: "Earned 10000+ credits", requirement: "totalEarnings >= 10000" }
  ];

  // Check which badges are earned
  const earnedBadges = performance.badges || [];
  const unearned = availableBadges.filter(b => !earnedBadges.find(eb => eb.name === b.name));

  res.json({ 
    success: true, 
    data: {
      earned: earnedBadges,
      available: unearned,
      totalEarned: earnedBadges.length
    }
  });
});

// ==================== COMPARISON & BENCHMARKING ====================
/**
 * @desc    Compare driver with team average
 * @route   GET /api/performance/compare/:driverId
 * @access  Private
 */
exports.compareWithTeam = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const performance = await Performance.findOne({ driverId });

  if (!performance) {
    return res.status(404).json({ success: false, message: "Performance data not found" });
  }

  // Get team averages
  const allPerformance = await Performance.find().select("avgRating totalEarnings totalTrips safetyScore");
  const teamAvg = {
    avgRating: (allPerformance.reduce((sum, p) => sum + p.avgRating, 0) / allPerformance.length).toFixed(2),
    totalEarnings: (allPerformance.reduce((sum, p) => sum + p.totalEarnings, 0) / allPerformance.length).toFixed(2),
    safetyScore: (allPerformance.reduce((sum, p) => sum + p.safetyScore, 0) / allPerformance.length).toFixed(2)
  };

  const comparison = {
    driver: {
      avgRating: performance.avgRating,
      totalEarnings: performance.totalEarnings,
      safetyScore: performance.safetyScore,
      totalTrips: performance.totalTrips
    },
    teamAverage: teamAvg,
    comparison: {
      rating: performance.avgRating >= teamAvg.avgRating ? "Above Average" : "Below Average",
      earnings: performance.totalEarnings >= teamAvg.totalEarnings ? "Above Average" : "Below Average",
      safety: performance.safetyScore >= teamAvg.safetyScore ? "Above Average" : "Below Average"
    }
  };

  res.json({ success: true, data: comparison });
});

/**
 * @desc    Get leaderboard with rankings
 * @route   GET /api/performance/leaderboard
 * @access  Public
 */
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const { type = "rating", limit = 10 } = req.query;

  let sortOptions = {};
  if (type === "rating") sortOptions = { avgRating: -1, ratingCount: -1 };
  else if (type === "earnings") sortOptions = { totalEarnings: -1 };
  else if (type === "trips") sortOptions = { totalTrips: -1 };
  else if (type === "safety") sortOptions = { safetyScore: -1 };

  const leaderboard = await Performance.find()
    .populate("driverId", "name phone")
    .sort(sortOptions)
    .limit(parseInt(limit))
    .lean();

  // Add rank
  const rankedLeaderboard = leaderboard.map((item, index) => ({
    ...item,
    rank: index + 1
  }));

  res.json({
    success: true,
    type,
    data: rankedLeaderboard
  });
});

// ==================== PREDICTION & RECOMMENDATIONS ====================
/**
 * @desc    Get performance insights and recommendations
 * @route   GET /api/performance/insights/:driverId
 * @access  Private
 */
exports.getInsights = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const performance = await Performance.findOne({ driverId });

  if (!performance) {
    return res.status(404).json({ success: false, message: "Performance data not found" });
  }

  const insights = {
    strengths: [],
    improvements: [],
    recommendations: []
  };

  // Identify strengths
  if (performance.avgRating >= 4.5) insights.strengths.push("Excellent customer ratings");
  if (performance.safetyScore >= 90) insights.strengths.push("Outstanding safety record");
  if (performance.completionRate >= 98) insights.strengths.push("High completion rate");
  if (performance.totalTrips >= 500) insights.strengths.push("Experienced driver");

  // Identify improvements
  if (performance.avgRating < 4.0) insights.improvements.push("Customer ratings need improvement");
  if (performance.safetyScore < 80) insights.improvements.push("Safety score requires attention");
  if (performance.cancellationRate > 10) insights.improvements.push("Reduce trip cancellations");
  if (performance.onTimeDeliveryRate < 95) insights.improvements.push("Improve punctuality");

  // Generate recommendations
  if (insights.improvements.length > 0) {
    if (performance.avgRating < 4.0) {
      insights.recommendations.push("Take a customer service training course");
      insights.recommendations.push("Review recent low ratings and feedback");
    }
    if (performance.safetyScore < 80) {
      insights.recommendations.push("Attend defensive driving training");
      insights.recommendations.push("Review traffic rules and regulations");
    }
    if (performance.cancellationRate > 10) {
      insights.recommendations.push("Plan better to avoid trip cancellations");
    }
  } else {
    insights.recommendations.push("Maintain your excellent performance!");
    insights.recommendations.push("Consider mentoring new drivers");
    insights.recommendations.push("Apply for premium driver status");
  }

  res.json({ success: true, data: insights });
});

// ==================== REPORTS ====================
/**
 * @desc    Generate performance report
 * @route   GET /api/performance/report/:driverId
 * @access  Private
 */
exports.generateReport = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const { reportType = "monthly" } = req.query;

  const performance = await Performance.findOne({ driverId }).populate("driverId", "name email");

  if (!performance) {
    return res.status(404).json({ success: false, message: "Performance data not found" });
  }

  const report = {
    driver: performance.driverId.name,
    email: performance.driverId.email,
    reportType,
    generatedAt: new Date(),
    summary: {
      totalTrips: performance.totalTrips,
      completionRate: performance.completionRate,
      avgRating: performance.avgRating,
      totalEarnings: performance.totalEarnings,
      safetyScore: performance.safetyScore,
      level: performance.level
    },
    metrics: {
      operationalMetrics: {
        totalDistance: performance.totalDistance,
        totalHours: performance.totalHours,
        avgTripDuration: performance.avgTripDuration,
        tripsPerDay: performance.tripsPerDay
      },
      safetyMetrics: {
        incidents: performance.incidents,
        violations: performance.violations,
        safetyScore: performance.safetyScore
      },
      earningsMetrics: {
        totalEarnings: performance.totalEarnings,
        avgPerTrip: performance.avgEarningsPerTrip,
        avgPerHour: performance.avgEarningsPerHour
      }
    }
  };

  res.json({ success: true, data: report });
});
