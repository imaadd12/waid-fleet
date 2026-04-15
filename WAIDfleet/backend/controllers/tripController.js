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
