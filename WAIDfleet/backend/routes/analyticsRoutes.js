const express = require("express");
const router = express.Router();
const {
  getRevenueTrends,
  getTripDistribution,
  getTopEarners,
  getVehicleUtilization,
  getDriverStatusOverview,
  getDashboardAnalytics
} = require("../controllers/analyticsController");
const protect = require("../middleware/authMiddleware").protect;

// All routes require authentication
router.use(protect);

// Get revenue trends (daily, weekly, monthly)
router.get("/revenue-trends", getRevenueTrends);

// Get trip distribution
router.get("/trip-distribution", getTripDistribution);

// Get top earners
router.get("/top-earners", getTopEarners);

// Get vehicle utilization
router.get("/vehicle-utilization", getVehicleUtilization);

// Get driver status overview
router.get("/driver-status", getDriverStatusOverview);

// Get comprehensive dashboard analytics
router.get("/dashboard", getDashboardAnalytics);

module.exports = router;