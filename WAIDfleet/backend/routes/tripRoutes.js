const express = require("express");
const router = express.Router();
const {
  getActiveTrip,
  getMyTrips,
  simulateTrip,
  updateTripStatus,
  getAllTripsAdmin,
  createTripAdmin,
  assignDriverToTrip,
  updateTripStatusAdmin,
  deleteTripAdmin,
  getTripStatsAdmin,
} = require("../controllers/tripController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Driver routes
router.get("/active", protect, getActiveTrip);
router.get("/me", protect, getMyTrips);
router.post("/simulate", protect, simulateTrip);
router.put("/:id/status", protect, updateTripStatus);

// Admin routes — fixed paths first, then parameterised
router.get("/admin/stats", protect, adminOnly, getTripStatsAdmin);
router.get("/admin/all", protect, adminOnly, getAllTripsAdmin);
router.post("/admin/create", protect, adminOnly, createTripAdmin);
router.put("/admin/:id/assign", protect, adminOnly, assignDriverToTrip);
router.put("/admin/:id/status", protect, adminOnly, updateTripStatusAdmin);
router.delete("/admin/:id", protect, adminOnly, deleteTripAdmin);

module.exports = router;
