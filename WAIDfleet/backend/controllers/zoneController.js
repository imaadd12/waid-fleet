const Zone = require("../models/zoneModel");

// @desc    Create a new zone
// @route   POST /api/zones
// @access  Private (Admin)
const createZone = async (req, res) => {
  try {
    const { name, city, state, description, color, isActive, coordinates } = req.body;

    if (!name || !city) {
      return res.status(400).json({ success: false, message: "name and city are required." });
    }

    const zone = await Zone.create({
      name,
      city,
      state: state || null,
      description: description || null,
      color: color || undefined,
      isActive: isActive !== undefined ? isActive : true,
      coordinates: coordinates || undefined,
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, data: zone });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "A zone with this name already exists." });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all zones with populated drivers and vehicles
// @route   GET /api/zones
// @access  Private (Admin)
const getZones = async (req, res) => {
  try {
    const zones = await Zone.find()
      .populate("assignedDrivers", "name phone")
      .populate("assignedVehicles", "name plateNumber")
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: zones.length, data: zones });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update a zone
// @route   PUT /api/zones/:id
// @access  Private (Admin)
const updateZone = async (req, res) => {
  try {
    const zone = await Zone.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("assignedDrivers", "name phone")
      .populate("assignedVehicles", "name plateNumber");

    if (!zone) {
      return res.status(404).json({ success: false, message: "Zone not found." });
    }

    return res.json({ success: true, data: zone });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "A zone with this name already exists." });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete a zone
// @route   DELETE /api/zones/:id
// @access  Private (Admin)
const deleteZone = async (req, res) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);

    if (!zone) {
      return res.status(404).json({ success: false, message: "Zone not found." });
    }

    return res.json({ success: true, message: "Zone deleted successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Assign a driver to a zone
// @route   PUT /api/zones/:id/assign-driver
// @access  Private (Admin)
const assignDriverToZone = async (req, res) => {
  try {
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({ success: false, message: "driverId is required." });
    }

    const zone = await Zone.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { assignedDrivers: driverId } },
      { new: true }
    )
      .populate("assignedDrivers", "name phone")
      .populate("assignedVehicles", "name plateNumber");

    if (!zone) {
      return res.status(404).json({ success: false, message: "Zone not found." });
    }

    return res.json({ success: true, data: zone });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Assign a vehicle to a zone
// @route   PUT /api/zones/:id/assign-vehicle
// @access  Private (Admin)
const assignVehicleToZone = async (req, res) => {
  try {
    const { vehicleId } = req.body;

    if (!vehicleId) {
      return res.status(400).json({ success: false, message: "vehicleId is required." });
    }

    const zone = await Zone.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { assignedVehicles: vehicleId } },
      { new: true }
    )
      .populate("assignedDrivers", "name phone")
      .populate("assignedVehicles", "name plateNumber");

    if (!zone) {
      return res.status(404).json({ success: false, message: "Zone not found." });
    }

    return res.json({ success: true, data: zone });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Remove a driver from a zone
// @route   PUT /api/zones/:id/remove-driver
// @access  Private (Admin)
const removeDriverFromZone = async (req, res) => {
  try {
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({ success: false, message: "driverId is required." });
    }

    const zone = await Zone.findByIdAndUpdate(
      req.params.id,
      { $pull: { assignedDrivers: driverId } },
      { new: true }
    )
      .populate("assignedDrivers", "name phone")
      .populate("assignedVehicles", "name plateNumber");

    if (!zone) {
      return res.status(404).json({ success: false, message: "Zone not found." });
    }

    return res.json({ success: true, data: zone });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Remove a vehicle from a zone
// @route   PUT /api/zones/:id/remove-vehicle
// @access  Private (Admin)
const removeVehicleFromZone = async (req, res) => {
  try {
    const { vehicleId } = req.body;

    if (!vehicleId) {
      return res.status(400).json({ success: false, message: "vehicleId is required." });
    }

    const zone = await Zone.findByIdAndUpdate(
      req.params.id,
      { $pull: { assignedVehicles: vehicleId } },
      { new: true }
    )
      .populate("assignedDrivers", "name phone")
      .populate("assignedVehicles", "name plateNumber");

    if (!zone) {
      return res.status(404).json({ success: false, message: "Zone not found." });
    }

    return res.json({ success: true, data: zone });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createZone,
  getZones,
  updateZone,
  deleteZone,
  assignDriverToZone,
  assignVehicleToZone,
  removeDriverFromZone,
  removeVehicleFromZone,
};
