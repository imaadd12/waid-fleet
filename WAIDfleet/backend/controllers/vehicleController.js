const asyncHandler = require("express-async-handler");
const Vehicle = require("../models/vehicleModel");
const Driver = require("../models/driverModel");
const AuditLog = require("../models/auditLogModel");
const SystemConfig = require("../models/systemConfigModel");

// @desc    Get all vehicles with filtering and pagination
// @route   GET /api/vehicles
// @access  Private
const getVehicles = asyncHandler(async (req, res) => {
  const { status, assignedDriver, search, page = 1, limit = 10 } = req.query;
  
  let query = {};
  
  if (status && status !== 'all') query.status = status;
  if (assignedDriver) query.assignedDriver = assignedDriver;
  
  if (search) {
    const matchingDrivers = await Driver.find({ name: { $regex: search, $options: 'i' } }).select('_id');
    const driverIds = matchingDrivers.map(d => d._id);
    
    query.$or = [
      { plateNumber: { $regex: search, $options: 'i' } },
      { assignedDriver: { $in: driverIds } }
    ];
  }
  
  const skip = (page - 1) * limit;
  
  const vehicles = await Vehicle.find(query)
    .populate('assignedDriver', 'name phone email onDuty')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  
  const total = await Vehicle.countDocuments(query);
  
  res.json({
    success: true,
    count: vehicles.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: vehicles
  });
});

// @desc    Get single vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Private
const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
    .populate('assignedDriver', 'name phone email age experience aadharNumber licenseNumber onDuty');
  
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }
  
  res.json({
    success: true,
    data: vehicle
  });
});

// @desc    Create new vehicle
// @route   POST /api/vehicles
// @access  Private (Admin only)
const createVehicle = asyncHandler(async (req, res) => {
  const {
    name,
    plateNumber,
    type,
    color,
    registrationNumber,
    registrationExpiry,
    insuranceExpiry,
    fuelType,
    mileage,
    lastServiceDate,
    nextServiceDue,
    assignedDriver
  } = req.body;

  // Validate required fields
  if (!name || !plateNumber || !type || !registrationNumber) {
    res.status(400);
    throw new Error('Please provide all required fields: name, plateNumber, type, registrationNumber');
  }

  // Check if plate number already exists
  const vehicleExists = await Vehicle.findOne({ plateNumber });
  if (vehicleExists) {
    res.status(400);
    throw new Error('Vehicle with this plate number already exists');
  }

  // Check if registration number already exists
  const regExists = await Vehicle.findOne({ registrationNumber });
  if (regExists) {
    res.status(400);
    throw new Error('Vehicle with this registration number already exists');
  }

  // Validate driver if provided
  if (assignedDriver) {
    const driver = await Driver.findById(assignedDriver);
    if (!driver) {
      res.status(404);
      throw new Error('Driver not found');
    }
  }

  const vehicle = await Vehicle.create({
    name,
    plateNumber,
    type,
    color,
    registrationNumber,
    registrationExpiry: registrationExpiry ? new Date(registrationExpiry) : null,
    insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
    fuelType,
    mileage: parseInt(mileage) || 0,
    lastServiceDate: lastServiceDate ? new Date(lastServiceDate) : null,
    nextServiceDue: nextServiceDue ? new Date(nextServiceDue) : null,
    assignedDriver: assignedDriver || null
  });

  const populatedVehicle = await Vehicle.findById(vehicle._id).populate('assignedDriver', 'name phone email onDuty');

  // 📝 Create Audit Log
  await AuditLog.create({
    actionType: 'create',
    entityType: 'Vehicle',
    entityId: vehicle._id,
    entityName: vehicle.plateNumber,
    performedBy: req.user._id,
    performedByName: req.user.name,
    performedByRole: req.user.role,
    module: 'vehicles',
    description: `New asset deployed: ${vehicle.plateNumber} (${vehicle.name})`
  });

  res.status(201).json({
    success: true,
    message: 'Vehicle created successfully',
    data: populatedVehicle
  });
});

// @desc    Add multiple vehicles
// @route   POST /api/vehicles/batch
// @access  Private (Admin only)
const createMultipleVehicles = asyncHandler(async (req, res) => {
  const { vehicles } = req.body;

  if (!vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
    res.status(400);
    throw new Error('Please provide an array of vehicles');
  }

  // Validate and prepare vehicles
  const vehicleData = [];
  const plateNumbers = new Set();
  const regNumbers = new Set();

  for (const vehicle of vehicles) {
    const { name, plateNumber, type, registrationNumber, color, fuelType, assignedDriver } = vehicle;

    // Validate required fields
    if (!name || !plateNumber || !type || !registrationNumber) {
      res.status(400);
      throw new Error('Each vehicle must have: name, plateNumber, type, registrationNumber');
    }

    // Check for duplicates within batch
    if (plateNumbers.has(plateNumber) || regNumbers.has(registrationNumber)) {
      res.status(400);
      throw new Error(`Duplicate plate or registration number: ${plateNumber}`);
    }

    plateNumbers.add(plateNumber);
    regNumbers.add(registrationNumber);

    // Validate driver if provided
    if (assignedDriver) {
      const driver = await Driver.findById(assignedDriver);
      if (!driver) {
        res.status(404);
        throw new Error(`Driver not found: ${assignedDriver}`);
      }
    }

    vehicleData.push({
      name,
      plateNumber,
      type,
      registrationNumber,
      color,
      fuelType: fuelType || 'petrol',
      assignedDriver: assignedDriver || null
    });
  }

  // Check for existing vehicles in database
  const existingPlates = await Vehicle.find({ plateNumber: { $in: Array.from(plateNumbers) } });
  if (existingPlates.length > 0) {
    res.status(400);
    throw new Error(`Plate numbers already exist: ${existingPlates.map(v => v.plateNumber).join(', ')}`);
  }

  const existingRegs = await Vehicle.find({ registrationNumber: { $in: Array.from(regNumbers) } });
  if (existingRegs.length > 0) {
    res.status(400);
    throw new Error(`Registration numbers already exist: ${existingRegs.map(v => v.registrationNumber).join(', ')}`);
  }

  // Create all vehicles
  const createdVehicles = await Vehicle.insertMany(vehicleData);

  // Populate driver info
  const populatedVehicles = await Vehicle.find({ _id: { $in: createdVehicles.map(v => v._id) } })
    .populate('assignedDriver', 'name phone email onDuty');

  res.status(201).json({
    success: true,
    message: `${createdVehicles.length} vehicles created successfully`,
    count: createdVehicles.length,
    data: populatedVehicles
  });
});

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Private (Admin only)
const updateVehicle = asyncHandler(async (req, res) => {
  let vehicle = await Vehicle.findById(req.params.id);

  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  const {
    name,
    plateNumber,
    type,
    color,
    registrationNumber,
    registrationExpiry,
    insuranceExpiry,
    fuelType,
    mileage,
    lastServiceDate,
    nextServiceDue,
    status,
    assignedDriver
  } = req.body;

  // Check if new plate number is unique
  if (plateNumber && plateNumber !== vehicle.plateNumber) {
    const existingPlate = await Vehicle.findOne({ plateNumber });
    if (existingPlate) {
      res.status(400);
      throw new Error('Plate number already exists');
    }
  }

  // Check if new registration number is unique
  if (registrationNumber && registrationNumber !== vehicle.registrationNumber) {
    const existingReg = await Vehicle.findOne({ registrationNumber });
    if (existingReg) {
      res.status(400);
      throw new Error('Registration number already exists');
    }
  }

  // Validate driver if provided
  if (assignedDriver && assignedDriver !== vehicle.assignedDriver?.toString()) {
    const driver = await Driver.findById(assignedDriver);
    if (!driver) {
      res.status(404);
      throw new Error('Driver not found');
    }
  }

  // Update fields
  if (name) vehicle.name = name;
  if (plateNumber) vehicle.plateNumber = plateNumber;
  if (type) vehicle.type = type;
  if (color) vehicle.color = color;
  if (registrationNumber) vehicle.registrationNumber = registrationNumber;
  if (registrationExpiry) vehicle.registrationExpiry = new Date(registrationExpiry);
  if (insuranceExpiry) vehicle.insuranceExpiry = new Date(insuranceExpiry);
  if (fuelType) vehicle.fuelType = fuelType;
  if (mileage !== undefined) vehicle.mileage = parseInt(mileage);
  if (lastServiceDate) vehicle.lastServiceDate = new Date(lastServiceDate);
  if (nextServiceDue) vehicle.nextServiceDue = new Date(nextServiceDue);
  if (status) vehicle.status = status;
  if (assignedDriver !== undefined) vehicle.assignedDriver = assignedDriver || null;

  await vehicle.save();

  const updatedVehicle = await Vehicle.findById(vehicle._id).populate('assignedDriver', 'name phone email onDuty');

  res.json({
    success: true,
    message: 'Vehicle updated successfully',
    data: updatedVehicle
  });
});

// @desc    Assign driver to vehicle
// @route   PUT /api/vehicles/:id/assign-driver
// @access  Private (Admin only)
const assignDriver = asyncHandler(async (req, res) => {
  const { driverId } = req.body;

  if (!driverId) {
    res.status(400);
    throw new Error('Driver ID is required');
  }

  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  // Check if driver exists
  const driver = await Driver.findById(driverId);
  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }

  // Remove current driver from any other vehicle
  await Vehicle.updateMany(
    { assignedDriver: driverId },
    { assignedDriver: null }
  );

  // Assign new driver
  vehicle.assignedDriver = driverId;
  await vehicle.save();

  const updatedVehicle = await Vehicle.findById(vehicle._id).populate('assignedDriver', 'name phone email onDuty');

  res.json({
    success: true,
    message: 'Driver assigned successfully',
    data: updatedVehicle
  });
});

// @desc    Unassign driver from vehicle
// @route   PUT /api/vehicles/:id/unassign-driver
// @access  Private (Admin only)
const unassignDriver = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);

  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  vehicle.assignedDriver = null;
  await vehicle.save();

  const updatedVehicle = await Vehicle.findById(vehicle._id).populate('assignedDriver', 'name phone email onDuty');

  res.json({
    success: true,
    message: 'Driver unassigned successfully',
    data: updatedVehicle
  });
});

// @desc    Add maintenance record
// @route   PUT /api/vehicles/:id/maintenance
// @access  Private (Admin only)
const addMaintenance = asyncHandler(async (req, res) => {
  const { type, description, cost } = req.body;

  if (!type || !description) {
    res.status(400);
    throw new Error('Type and description are required');
  }

  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  vehicle.maintenanceHistory.push({
    type,
    description,
    cost: parseInt(cost) || 0,
    date: new Date()
  });

  await vehicle.save();

  res.json({
    success: true,
    message: 'Maintenance record added',
    data: vehicle
  });
});

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (Admin only)
const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  res.json({
    success: true,
    message: 'Vehicle deleted successfully',
    data: vehicle
  });
});

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  createMultipleVehicles,
  updateVehicle,
  assignDriver,
  unassignDriver,
  addMaintenance,
  deleteVehicle
};
