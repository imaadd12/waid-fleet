const Trip = require("../models/tripModel");
const Driver = require("../models/driverModel");
const Earnings = require("../models/earningsModel");
const asyncHandler = require("express-async-handler");

// @desc    Get current active trip for driver
// @route   GET /api/trips/active
// @access  Private (Driver)
exports.getActiveTrip = asyncHandler(async (req, res) => {
  const driverId = req.user.id;
  
  // Find any trip that is active (not completed or cancelled)
  const trip = await Trip.findOne({
    driverId,
    status: { $in: ["assigned", "arrived_pickup", "in_progress"] }
  });

  res.json({
    success: true,
    data: trip || null
  });
});

// @desc    Get all past trips for a driver
// @route   GET /api/trips/me
// @access  Private (Driver)
exports.getMyTrips = asyncHandler(async (req, res) => {
  const driverId = req.user.id;
  const trips = await Trip.find({ driverId }).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: trips.length,
    data: trips
  });
});

// @desc    Simulate/dispatch a new trip request to the driver
// @route   POST /api/trips/simulate
// @access  Private (Driver)
exports.simulateTrip = asyncHandler(async (req, res) => {
  const driverId = req.user.id;

  // Verify driver is On Duty
  const driver = await Driver.findById(driverId);
  if (!driver || !driver.onDuty) {
    return res.status(400).json({ message: "You must go On Duty to receive trips." });
  }

  // Prevent multiple active trips
  const currentTrip = await Trip.findOne({
    driverId,
    status: { $in: ["assigned", "arrived_pickup", "in_progress"] }
  });

  if (currentTrip) {
    return res.status(400).json({ message: "You already have an active trip." });
  }

  // Random distance between 2 and 20 km
  const distanceKm = Math.floor(Math.random() * 18) + 2; 
  // Fare formula: base 50 + 12 per km
  const generatedFare = 50 + (12 * distanceKm);
  const estimatedDuration = distanceKm * 3.5; // roughly 3.5 mins per km

  const newTrip = await Trip.create({
    driverId,
    status: "assigned", // Skip 'requested' for quick demo (auto-accepted by pushing)
    fare: generatedFare,
    distance: distanceKm,
    duration: Math.round(estimatedDuration),
    passengerDetails: {
      name: "Mock Passenger - " + Math.floor(Math.random() * 1000),
      phone: "+1 555-01" + Math.floor(Math.random() * 99)
    },
    pickupLocation: {
      address: "123 Random Pickup Ave, City Center",
      latitude: 40.7128 + (Math.random() - 0.5) * 0.05,
      longitude: -74.0060 + (Math.random() - 0.5) * 0.05,
    },
    dropLocation: {
      address: "88 Dropoff Blvd, Suburbs",
      latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
      longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
    }
  });

  res.status(201).json({
    success: true,
    data: newTrip,
    message: "New trip simulated and assigned."
  });
});

// @desc    Update trip status (State Machine)
// @route   PUT /api/trips/:id/status
// @access  Private (Driver)
exports.updateTripStatus = asyncHandler(async (req, res) => {
  const tripId = req.params.id;
  const { status } = req.body;
  const driverId = req.user.id;

  const validTransitions = ["arrived_pickup", "in_progress", "completed", "cancelled"];
  if (!validTransitions.includes(status)) {
    return res.status(400).json({ message: "Invalid status transition" });
  }

  const trip = await Trip.findOne({ _id: tripId, driverId });
  if (!trip) {
    return res.status(404).json({ message: "Trip not found or access denied" });
  }

  // Handle completion logistics
  if (status === "completed") {
    trip.endTime = new Date();
    
    // Automatically credit driver
    // We update their monthly earnings document, or create one if it doesn't exist
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0,0,0,0);

    await Earnings.findOneAndUpdate(
      { driverId, fromDate: { $lte: new Date() }, toDate: { $gte: new Date() } },
      { 
        $inc: { totalEarning: trip.fare, totalDistance: trip.distance, totalTrips: 1 } 
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  if (status === "in_progress" && !trip.startTime) {
    trip.startTime = new Date();
  }

  trip.status = status;
  await trip.save();

  res.json({
    success: true,
    data: trip,
    message: `Trip marked as ${status}`
  });
});

// ─────────────────────────────────────────────
// ADMIN ENDPOINTS
// ─────────────────────────────────────────────

// @desc    Get all trips (admin) with pagination & filters
// @route   GET /api/trips/admin/all
// @access  Private (Admin)
exports.getAllTripsAdmin = asyncHandler(async (req, res) => {
  const { status, driverId, page = 1, limit = 50 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (driverId) filter.driverId = driverId;

  const skip = (Number(page) - 1) * Number(limit);

  const [trips, total] = await Promise.all([
    Trip.find(filter)
      .populate("driverId", "name phone")
      .populate("vehicleId", "name plateNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Trip.countDocuments(filter),
  ]);

  res.json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    count: trips.length,
    data: trips,
  });
});

// @desc    Create a trip from admin
// @route   POST /api/trips/admin/create
// @access  Private (Admin)
exports.createTripAdmin = asyncHandler(async (req, res) => {
  const { driverId, vehicleId, pickupLocation, dropLocation, passengerDetails, fare } = req.body;

  if (!driverId) {
    return res.status(400).json({ success: false, message: "driverId is required" });
  }

  const trip = await Trip.create({
    driverId,
    vehicleId: vehicleId || undefined,
    pickupLocation,
    dropLocation,
    passengerDetails,
    fare: fare || 0,
    status: "requested",
  });

  res.status(201).json({ success: true, data: trip });
});

// @desc    Assign a driver (and optionally vehicle) to a trip
// @route   PUT /api/trips/admin/:id/assign
// @access  Private (Admin)
exports.assignDriverToTrip = asyncHandler(async (req, res) => {
  const { driverId, vehicleId } = req.body;

  if (!driverId) {
    return res.status(400).json({ success: false, message: "driverId is required" });
  }

  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    return res.status(404).json({ success: false, message: "Trip not found" });
  }

  trip.driverId = driverId;
  if (vehicleId) trip.vehicleId = vehicleId;
  if (trip.status === "requested") trip.status = "assigned";
  await trip.save();

  res.json({ success: true, data: trip, message: "Driver assigned successfully" });
});

// @desc    Admin update trip status to any valid value
// @route   PUT /api/trips/admin/:id/status
// @access  Private (Admin)
exports.updateTripStatusAdmin = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["requested", "assigned", "arrived_pickup", "in_progress", "completed", "cancelled"];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }

  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    return res.status(404).json({ success: false, message: "Trip not found" });
  }

  if (status === "in_progress" && !trip.startTime) trip.startTime = new Date();
  if (status === "completed") {
    if (!trip.startTime) trip.startTime = new Date();
    if (!trip.endTime) trip.endTime = new Date();
  }

  trip.status = status;
  await trip.save();

  res.json({ success: true, data: trip, message: `Trip status updated to ${status}` });
});

// @desc    Delete a trip (admin)
// @route   DELETE /api/trips/admin/:id
// @access  Private (Admin)
exports.deleteTripAdmin = asyncHandler(async (req, res) => {
  const trip = await Trip.findByIdAndDelete(req.params.id);
  if (!trip) {
    return res.status(404).json({ success: false, message: "Trip not found" });
  }

  res.json({ success: true, message: "Trip deleted successfully" });
});

// @desc    Get trip statistics summary
// @route   GET /api/trips/admin/stats
// @access  Private (Admin)
exports.getTripStatsAdmin = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [statusCounts, totalTrips, todaysTrips, revenueData] = await Promise.all([
    Trip.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Trip.countDocuments(),
    Trip.countDocuments({ createdAt: { $gte: startOfToday } }),
    Trip.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$fare" }, avgFare: { $avg: "$fare" } } },
    ]),
  ]);

  const byStatus = {
    requested: 0,
    assigned: 0,
    arrived_pickup: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  };
  statusCounts.forEach(({ _id, count }) => {
    if (_id in byStatus) byStatus[_id] = count;
  });

  const revenue = revenueData[0] || { totalRevenue: 0, avgFare: 0 };

  res.json({
    success: true,
    data: {
      totalTrips,
      todaysTrips,
      byStatus,
      totalRevenue: revenue.totalRevenue,
      avgFare: revenue.avgFare ? Number(revenue.avgFare.toFixed(2)) : 0,
    },
  });
});
