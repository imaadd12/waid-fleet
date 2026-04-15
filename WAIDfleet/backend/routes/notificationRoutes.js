const express = require("express");
const router = express.Router();
const {
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  updateNotificationStatus,
  deleteNotification,
  createServiceReminder
} = require("../controllers/notificationController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// @route   GET /api/notifications
// @desc    Get all notifications
// @access  Private
router.get("/", protect, getNotifications);

// @route   GET /api/notifications/:id
// @desc    Get single notification
// @access  Private
router.get("/:id", protect, getNotificationById);

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put("/:id/read", protect, markAsRead);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put("/read-all", protect, markAllAsRead);

// @route   PUT /api/notifications/:id/status
// @desc    Update notification status
// @access  Private
router.put("/:id/status", protect, updateNotificationStatus);

// @route   POST /api/notifications/service-reminder
// @desc    Create service reminder
// @access  Private (Admin only)
router.post("/service-reminder", protect, adminOnly, createServiceReminder);

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete("/:id", protect, deleteNotification);

module.exports = router;
