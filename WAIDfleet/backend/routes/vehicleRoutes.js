const express = require("express");
const router = express.Router();
const {
  getVehicles,
  getVehicleById,
  createVehicle,
  createMultipleVehicles,
  updateVehicle,
  assignDriver,
  unassignDriver,
  addMaintenance,
  deleteVehicle
} = require("../controllers/vehicleController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// @route   GET /api/vehicles
// @desc    Get all vehicles with filtering
// @access  Private
router.get("/", protect, getVehicles);

// @route   GET /api/vehicles/:id
// @desc    Get vehicle by ID
// @access  Private
router.get("/:id", protect, getVehicleById);

// @route   POST /api/vehicles
// @desc    Create a new vehicle
// @access  Private (Admin only)
router.post("/", protect, adminOnly, createVehicle);

// @route   POST /api/vehicles/batch
// @desc    Create multiple vehicles at once
// @access  Private (Admin only)
router.post("/batch", protect, adminOnly, createMultipleVehicles);

// @route   PUT /api/vehicles/:id
// @desc    Update vehicle
// @access  Private (Admin only)
router.put("/:id", protect, adminOnly, updateVehicle);

// @route   PUT /api/vehicles/:id/assign-driver
// @desc    Assign driver to vehicle
// @access  Private (Admin only)
router.put("/:id/assign-driver", protect, adminOnly, assignDriver);

// @route   PUT /api/vehicles/:id/unassign-driver
// @desc    Unassign driver from vehicle
// @access  Private (Admin only)
router.put("/:id/unassign-driver", protect, adminOnly, unassignDriver);

// @route   PUT /api/vehicles/:id/maintenance
// @desc    Add maintenance record
// @access  Private (Admin only)
router.put("/:id/maintenance", protect, adminOnly, addMaintenance);

// @route   DELETE /api/vehicles/:id
// @desc    Delete vehicle
// @access  Private (Admin only)
router.delete("/:id", protect, adminOnly, deleteVehicle);

module.exports = router;