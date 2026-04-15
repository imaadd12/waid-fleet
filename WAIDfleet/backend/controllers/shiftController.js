const Shift = require("../models/shiftModel");
const asyncHandler = require("express-async-handler");

// @desc    Start a new shift
// @route   POST /api/shifts/start
// @access  Private
exports.startShift = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  // Check if driver has ongoing shift
  const ongoingShift = await Shift.findOne({
    driverId: req.user.id,
    status: "ongoing",
  });

  if (ongoingShift) {
    return res.status(400).json({
      success: false,
      message: "You already have an ongoing shift",
    });
  }

  const shift = await Shift.create({
    driverId: req.user.id,
    startTime: new Date(),
    status: "ongoing",
    notes: notes || "",
  });

  res.status(201).json({
    success: true,
    message: "Shift started successfully",
    data: shift,
  });
});

// @desc    End ongoing shift
// @route   PUT /api/shifts/end
// @access  Private
exports.endShift = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  const shift = await Shift.findOne({
    driverId: req.user.id,
    status: "ongoing",
  });

  if (!shift) {
    return res.status(404).json({
      success: false,
      message: "No ongoing shift found",
    });
  }

  shift.endTime = new Date();
  shift.status = "completed";
  shift.totalHours = (shift.endTime - shift.startTime) / (1000 * 60 * 60); // in hours
  if (notes) shift.notes = notes;

  await shift.save();

  res.json({
    success: true,
    message: "Shift ended successfully",
    data: shift,
  });
});

// @desc    Get driver's current shift
// @route   GET /api/shifts/current
// @access  Private
exports.getCurrentShift = asyncHandler(async (req, res) => {
  const shift = await Shift.findOne({
    driverId: req.user.id,
    status: "ongoing",
  });

  res.json({
    success: true,
    data: shift || null,
  });
});

// @desc    Get all shifts for a driver
// @route   GET /api/shifts
// @access  Private
exports.getShifts = asyncHandler(async (req, res) => {
  const { from, to, status, page = 1, limit = 10 } = req.query;

  let filter = { driverId: req.user.id };

  if (from || to) {
    filter.startTime = {};
    if (from) filter.startTime.$gte = new Date(from);
    if (to) filter.startTime.$lte = new Date(to);
  }

  if (status) filter.status = status;

  const total = await Shift.countDocuments(filter);
  const shifts = await Shift.find(filter)
    .sort({ startTime: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: shifts,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Update shift statistics (called after trip completes)
// @route   PUT /api/shifts/:shiftId/update-stats
// @access  Private
exports.updateShiftStats = asyncHandler(async (req, res) => {
  const { tripEarnings, tripDistance } = req.body;

  const shift = await Shift.findById(req.params.shiftId);

  if (!shift) {
    return res.status(404).json({
      success: false,
      message: "Shift not found",
    });
  }

  shift.totalTrips += 1;
  shift.totalEarnings += tripEarnings || 0;
  shift.totalDistance += tripDistance || 0;

  await shift.save();

  res.json({
    success: true,
    message: "Shift statistics updated",
    data: shift,
  });
});

// @desc    Get all shifts (Admin)
// @route   GET /api/shifts/admin/all
// @access  Private/Admin
exports.getAllShifts = asyncHandler(async (req, res) => {
  const { driverId, status, from, to, page = 1, limit = 10 } = req.query;

  let filter = {};

  if (driverId) filter.driverId = driverId;
  if (status) filter.status = status;

  if (from || to) {
    filter.startTime = {};
    if (from) filter.startTime.$gte = new Date(from);
    if (to) filter.startTime.$lte = new Date(to);
  }

  const total = await Shift.countDocuments(filter);
  const shifts = await Shift.find(filter)
    .populate("driverId", "name phone email")
    .sort({ startTime: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: shifts,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    },
  });
});
