const express = require("express");
const router = express.Router();
const {
  getServiceSchedules,
  getServiceScheduleById,
  createServiceSchedule,
  updateServiceSchedule,
  completeService,
  getUpcomingServices,
  getOverdueServices,
  deleteServiceSchedule
} = require("../controllers/serviceController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// @route   GET /api/services
// @desc    Get all service schedules
// @access  Private
router.get("/", protect, getServiceSchedules);

// @route   GET /api/services/upcoming
// @desc    Get upcoming services
// @access  Private
router.get("/upcoming", protect, getUpcomingServices);

// @route   GET /api/services/overdue
// @desc    Get overdue services
// @access  Private
router.get("/overdue", protect, getOverdueServices);

// @route   GET /api/services/:id
// @desc    Get service schedule by ID
// @access  Private
router.get("/:id", protect, getServiceScheduleById);

// @route   POST /api/services
// @desc    Create service schedule
// @access  Private (Admin only)
router.post("/", protect, adminOnly, createServiceSchedule);

// @route   PUT /api/services/:id
// @desc    Update service schedule
// @access  Private (Admin only)
router.put("/:id", protect, adminOnly, updateServiceSchedule);

// @route   PUT /api/services/:id/complete
// @desc    Mark service as completed
// @access  Private (Admin only)
router.put("/:id/complete", protect, adminOnly, completeService);

// @route   DELETE /api/services/:id
// @desc    Delete service schedule
// @access  Private (Admin only)
router.delete("/:id", protect, adminOnly, deleteServiceSchedule);

module.exports = router;
