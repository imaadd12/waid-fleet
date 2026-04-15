const asyncHandler = require("express-async-handler");
const ServiceSchedule = require("../models/serviceScheduleModel");
const Notification = require("../models/notificationModel");
const Vehicle = require("../models/vehicleModel");
const Driver = require("../models/driverModel");

// @desc    Get all service schedules
// @route   GET /api/services
// @access  Private
const getServiceSchedules = asyncHandler(async (req, res) => {
  const { vehicleId, driverId, status, page = 1, limit = 10 } = req.query;

  let query = {};
  if (vehicleId) query.vehicleId = vehicleId;
  if (driverId) query.driverId = driverId;
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const services = await ServiceSchedule.find(query)
    .populate('vehicleId', 'name plateNumber')
    .populate('driverId', 'name phone email')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ nextServiceDate: 1 });

  const total = await ServiceSchedule.countDocuments(query);

  res.json({
    success: true,
    count: services.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: services
  });
});

// @desc    Get service schedule by ID
// @route   GET /api/services/:id
// @access  Private
const getServiceScheduleById = asyncHandler(async (req, res) => {
  const service = await ServiceSchedule.findById(req.params.id)
    .populate('vehicleId')
    .populate('driverId');

  if (!service) {
    res.status(404);
    throw new Error('Service schedule not found');
  }

  res.json({
    success: true,
    data: service
  });
});

// @desc    Create service schedule
// @route   POST /api/services
// @access  Private (Admin only)
const createServiceSchedule = asyncHandler(async (req, res) => {
  const {
    vehicleId,
    driverId,
    serviceType,
    description,
    nextServiceDate,
    frequency,
    estimatedCost,
    reminderDaysBefore,
    serviceProvider
  } = req.body;

  // Validate required fields
  if (!vehicleId || !driverId || !nextServiceDate) {
    res.status(400);
    throw new Error('Please provide vehicleId, driverId, and nextServiceDate');
  }

  // Verify vehicle and driver exist
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  const driver = await Driver.findById(driverId);
  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }

  const serviceSchedule = await ServiceSchedule.create({
    vehicleId,
    driverId,
    serviceType: serviceType || 'routine',
    description,
    nextServiceDate: new Date(nextServiceDate),
    frequency: frequency || 'monthly',
    estimatedCost: parseInt(estimatedCost) || 0,
    reminderDaysBefore: reminderDaysBefore || 7,
    serviceProvider,
    status: 'scheduled'
  });

  const populatedService = await ServiceSchedule.findById(serviceSchedule._id)
    .populate('vehicleId', 'name plateNumber')
    .populate('driverId', 'name phone email');

  res.status(201).json({
    success: true,
    message: 'Service schedule created successfully',
    data: populatedService
  });
});

// @desc    Update service schedule
// @route   PUT /api/services/:id
// @access  Private (Admin only)
const updateServiceSchedule = asyncHandler(async (req, res) => {
  let service = await ServiceSchedule.findById(req.params.id);

  if (!service) {
    res.status(404);
    throw new Error('Service schedule not found');
  }

  const {
    serviceType,
    description,
    nextServiceDate,
    frequency,
    estimatedCost,
    reminderDaysBefore,
    status,
    serviceProvider,
    notes
  } = req.body;

  if (serviceType) service.serviceType = serviceType;
  if (description) service.description = description;
  if (nextServiceDate) service.nextServiceDate = new Date(nextServiceDate);
  if (frequency) service.frequency = frequency;
  if (estimatedCost !== undefined) service.estimatedCost = parseInt(estimatedCost);
  if (reminderDaysBefore !== undefined) service.reminderDaysBefore = reminderDaysBefore;
  if (status) service.status = status;
  if (serviceProvider) service.serviceProvider = serviceProvider;
  if (notes) service.notes = notes;

  await service.save();

  const updatedService = await ServiceSchedule.findById(service._id)
    .populate('vehicleId', 'name plateNumber')
    .populate('driverId', 'name phone email');

  res.json({
    success: true,
    message: 'Service schedule updated successfully',
    data: updatedService
  });
});

// @desc    Mark service as completed
// @route   PUT /api/services/:id/complete
// @access  Private (Admin only)
const completeService = asyncHandler(async (req, res) => {
  const { completedDate, notes } = req.body;

  let service = await ServiceSchedule.findById(req.params.id);

  if (!service) {
    res.status(404);
    throw new Error('Service schedule not found');
  }

  service.status = 'completed';
  service.completedDate = new Date(completedDate) || new Date();
  service.lastServiceDate = new Date(completedDate) || new Date();
  if (notes) service.notes = notes;

  // Calculate next service date based on frequency
  const nextDate = new Date(service.completedDate);
  switch (service.frequency) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'biannual':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'annual':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }
  service.nextServiceDate = nextDate;
  service.notificationSent = false; // Reset for next cycle

  await service.save();

  const updatedService = await ServiceSchedule.findById(service._id)
    .populate('vehicleId', 'name plateNumber')
    .populate('driverId', 'name phone email');

  res.json({
    success: true,
    message: 'Service marked as completed',
    data: updatedService
  });
});

// @desc    Get upcoming services
// @route   GET /api/services/upcoming
// @access  Private
const getUpcomingServices = asyncHandler(async (req, res) => {
  const { daysAhead = 30 } = req.query;

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + parseInt(daysAhead));

  const services = await ServiceSchedule.find({
    nextServiceDate: { $gte: new Date(), $lte: futureDate },
    status: { $in: ['scheduled', 'overdue'] }
  })
    .populate('vehicleId', 'name plateNumber')
    .populate('driverId', 'name phone email')
    .sort({ nextServiceDate: 1 });

  res.json({
    success: true,
    count: services.length,
    data: services
  });
});

// @desc    Get overdue services
// @route   GET /api/services/overdue
// @access  Private
const getOverdueServices = asyncHandler(async (req, res) => {
  const services = await ServiceSchedule.find({
    nextServiceDate: { $lt: new Date() },
    status: { $in: ['scheduled', 'overdue'] }
  })
    .populate('vehicleId', 'name plateNumber')
    .populate('driverId', 'name phone email')
    .sort({ nextServiceDate: 1 });

  res.json({
    success: true,
    count: services.length,
    data: services
  });
});

// @desc    Delete service schedule
// @route   DELETE /api/services/:id
// @access  Private (Admin only)
const deleteServiceSchedule = asyncHandler(async (req, res) => {
  const service = await ServiceSchedule.findByIdAndDelete(req.params.id);

  if (!service) {
    res.status(404);
    throw new Error('Service schedule not found');
  }

  res.json({
    success: true,
    message: 'Service schedule deleted successfully',
    data: service
  });
});

module.exports = {
  getServiceSchedules,
  getServiceScheduleById,
  createServiceSchedule,
  updateServiceSchedule,
  completeService,
  getUpcomingServices,
  getOverdueServices,
  deleteServiceSchedule
};
