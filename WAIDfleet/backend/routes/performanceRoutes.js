const express = require("express");
const router = express.Router();
const {
  getPerformanceDashboard,
  getRatingBreakdown,
  getRecentReviews,
  getPerformanceTrends,
  getHourlyAnalytics,
  getWeeklyPatterns,
  getIncidentHistory,
  getSafetyDetails,
  getEarningsBreakdown,
  getEarningsHistory,
  createGoal,
  getGoals,
  updateGoalProgress,
  getAlerts,
  markAlertAsRead,
  generateAlerts,
  getBadges,
  compareWithTeam,
  getLeaderboard,
  getInsights,
  generateReport
} = require("../controllers/performanceEnhancedController");
const { 
  getPerformanceDashboard: getDriverPerformance,
  getFleetHealth 
} = require("../controllers/performanceController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// ==================== ADMIN FLEET OVERVIEW ====================
router.get("/admin/fleet-health", protect, adminOnly, getFleetHealth);

// ==================== DASHBOARD & OVERVIEW ====================
router.get("/dashboard/:driverId", protect, getPerformanceDashboard);

// ==================== RATINGS & REVIEWS ====================
router.get("/ratings/:driverId", protect, getRatingBreakdown);
router.get("/reviews/:driverId", protect, getRecentReviews);

// ==================== ANALYTICS & TRENDS ====================
router.get("/trends/:driverId", protect, getPerformanceTrends);
router.get("/hourly/:driverId", protect, getHourlyAnalytics);
router.get("/weekly-patterns/:driverId", protect, getWeeklyPatterns);

// ==================== SAFETY & COMPLIANCE ====================
router.get("/incidents/:driverId", protect, getIncidentHistory);
router.get("/safety/:driverId", protect, getSafetyDetails);

// ==================== EARNINGS & INCENTIVES ====================
router.get("/earnings/:driverId", protect, getEarningsBreakdown);
router.get("/earnings-history/:driverId", protect, getEarningsHistory);

// ==================== GOALS & TARGETS ====================
router.post("/goals/:driverId", protect, createGoal);
router.get("/goals/:driverId", protect, getGoals);
router.put("/goals/:driverId/:goalId", protect, updateGoalProgress);

// ==================== ALERTS & WARNINGS ====================
router.get("/alerts/:driverId", protect, getAlerts);
router.put("/alerts/:driverId/:alertId", protect, markAlertAsRead);
router.get("/generate-alerts/:driverId", protect, adminOnly, generateAlerts);

// ==================== ACHIEVEMENTS & BADGES ====================
router.get("/badges/:driverId", protect, getBadges);

// ==================== COMPARISON & BENCHMARKING ====================
router.get("/compare/:driverId", protect, compareWithTeam);
router.get("/leaderboard", getLeaderboard);

// ==================== INSIGHTS & RECOMMENDATIONS ====================
router.get("/insights/:driverId", protect, getInsights);

// ==================== REPORTS ====================
router.get("/report/:driverId", protect, generateReport);

module.exports = router;
