const express = require("express");
const router = express.Router();
const {
  createPayment,
  getPaymentHistory,
  getPaymentById,
  updatePaymentStatus,
  getAllPayments,
  getPaymentStats,
  processBulkPayments,
} = require("../controllers/paymentController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Driver routes
router.post("/", protect, adminOnly, createPayment);
router.get("/", protect, getPaymentHistory);
router.get("/:id", protect, getPaymentById);

// Admin routes
router.get("/admin/all", protect, adminOnly, getAllPayments);
router.get("/admin/stats", protect, adminOnly, getPaymentStats);
router.put("/:id", protect, adminOnly, updatePaymentStatus);
router.post("/admin/bulk", protect, adminOnly, processBulkPayments);

module.exports = router;