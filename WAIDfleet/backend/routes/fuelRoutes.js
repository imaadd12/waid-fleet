const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { addFuelLog, getFuelLogs, getFuelLogsByVehicle, getFuelStats, deleteFuelLog } = require("../controllers/fuelController");

router.post("/", protect, adminOnly, addFuelLog);
router.get("/", protect, adminOnly, getFuelLogs);
router.get("/stats", protect, adminOnly, getFuelStats);
router.get("/:vehicleId/logs", protect, adminOnly, getFuelLogsByVehicle);
router.delete("/:id", protect, adminOnly, deleteFuelLog);

module.exports = router;
