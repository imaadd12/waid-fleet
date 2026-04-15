const express = require("express");
const router = express.Router();
const {
  startShift,
  endShift,
  getCurrentShift,
  getShifts,
  updateShiftStats,
  getAllShifts,
} = require("../controllers/shiftController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Driver routes
router.post("/start", protect, startShift);
router.put("/end", protect, endShift);
router.get("/current", protect, getCurrentShift);
router.get("/", protect, getShifts);
router.put("/:shiftId/update-stats", protect, updateShiftStats);

// Admin routes
router.get("/admin/all", protect, adminOnly, getAllShifts);

module.exports = router;
