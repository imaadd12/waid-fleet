const express = require("express");
const router = express.Router();
const {
  reportIncident,
  getIncidents,
  getIncidentById,
  resolveIncident,
  getAllIncidents,
  getIncidentStats,
  logIncidentRepair,
  upload,
} = require("../controllers/incidentController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Driver routes
router.post("/report", protect, upload, reportIncident);
router.get("/", protect, getIncidents);
router.get("/:id", protect, getIncidentById);

// Admin routes
router.get("/admin/all", protect, adminOnly, getAllIncidents);
router.get("/admin/stats", protect, adminOnly, getIncidentStats);
router.put("/:id/resolve", protect, adminOnly, resolveIncident);
router.put("/:id/repair", protect, adminOnly, logIncidentRepair);

module.exports = router;
