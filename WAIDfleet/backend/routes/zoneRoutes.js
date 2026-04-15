const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  createZone,
  getZones,
  updateZone,
  deleteZone,
  assignDriverToZone,
  assignVehicleToZone,
  removeDriverFromZone,
  removeVehicleFromZone,
} = require("../controllers/zoneController");

router.post("/", protect, adminOnly, createZone);
router.get("/", protect, adminOnly, getZones);
router.put("/:id", protect, adminOnly, updateZone);
router.delete("/:id", protect, adminOnly, deleteZone);
router.put("/:id/assign-driver", protect, adminOnly, assignDriverToZone);
router.put("/:id/assign-vehicle", protect, adminOnly, assignVehicleToZone);
router.put("/:id/remove-driver", protect, adminOnly, removeDriverFromZone);
router.put("/:id/remove-vehicle", protect, adminOnly, removeVehicleFromZone);

module.exports = router;
