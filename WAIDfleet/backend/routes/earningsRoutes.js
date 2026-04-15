const express = require("express");
const router = express.Router();
const {
  generateEarnings,
  getEarnings,
  getEarningsSummary,
  approveEarnings,
  markAsPaid,
  getAllEarnings,
} = require("../controllers/earningsController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Driver routes
router.get("/", protect, getEarnings);
router.get("/summary", protect, getEarningsSummary);

// Admin routes
router.post("/generate", protect, adminOnly, generateEarnings);
router.get("/admin/all", protect, adminOnly, getAllEarnings);
router.put("/:id/approve", protect, adminOnly, approveEarnings);
router.put("/:id/paid", protect, adminOnly, markAsPaid);

module.exports = router;