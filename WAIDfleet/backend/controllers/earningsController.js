const Earnings = require("../models/earningsModel");
const Driver = require("../models/driverModel");
const Trip = require("../models/tripModel");
const Payment = require("../models/paymentModel");
const asyncHandler = require("express-async-handler");

// Generate Weekly / Monthly Bill
exports.generateEarnings = asyncHandler(async (req, res) => {
  const { driverId, fromDate, toDate } = req.body;

  if (!driverId || !fromDate || !toDate) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const start = new Date(fromDate);
  const end = new Date(toDate);

  if (start > end) {
    return res.status(400).json({ message: "Invalid date range" });
  }

  // Check duplicate bill
  const existingBill = await Earnings.findOne({
    driverId,
    fromDate: start,
    toDate: end,
  });

  if (existingBill) {
    return res.status(400).json({
      message: "Bill already generated for this period",
    });
  }

  // Get Driver
  const driver = await Driver.findById(driverId);
  if (!driver) {
    return res.status(404).json({ message: "Driver not found" });
  }

  // Get Trips
  const trips = await Trip.find({
    driverId,
    status: "completed",
    date: { $gte: start, $lte: end },
  });

  // Calculate totals
  let totalEarning = 0;
  let totalToll = 0;
  let totalBonus = 0;
  let totalIncentives = 0;
  const workingDays = new Set();
  let totalDistance = 0;
  let totalHours = 0;

  trips.forEach((trip) => {
    totalEarning += trip.fare || 0;
    totalToll += trip.toll || 0;
    totalDistance += trip.distance || 0;
    totalHours += (trip.duration || 0) / 60; // convert minutes to hours

    const day = new Date(trip.date).toDateString();
    workingDays.add(day);
  });

  const totalTrips = trips.length;
  const totalDaysWorked = workingDays.size;

  // Check for bonuses (e.g., 5+ star rating bonus)
  const avgRating = await Trip.aggregate([
    {
      $match: {
        driverId: require("mongoose").Types.ObjectId(driverId),
        date: { $gte: start, $lte: end },
        rating: { $exists: true, $gte: 5 },
      },
    },
    { $count: "count" },
  ]);

  if (avgRating.length > 0 && avgRating[0].count > 10) {
    totalBonus = 500; // ₹500 bonus for 10+ five-star trips
  }

  // Rent Logic
  let totalRent = 0;

  if (driver.rentType === "weekly") {
    totalRent = driver.weeklyRent || 0;
  } else if (driver.rentType === "monthly") {
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const monthlyRent = driver.monthlyRent || 0;
    const perDayRent = monthlyRent / 30;

    totalRent = perDayRent * diffDays;
  }

  const subscription = driver.subscription || 0;
  const advance = 0;

  // Final calculation
  const payout =
    totalEarning +
    totalToll +
    totalBonus +
    totalIncentives -
    totalRent -
    subscription -
    advance;

  const balance = payout;

  const earnings = await Earnings.create({
    driverId,
    fromDate: start,
    toDate: end,
    totalEarning,
    totalTrips,
    totalToll,
    totalRent,
    totalBonus,
    totalIncentives,
    subscription,
    advance,
    payout,
    balance,
    totalDistance,
    totalHours,
    avgEarningPerTrip: totalTrips > 0 ? (totalEarning / totalTrips).toFixed(2) : 0,
    avgEarningPerHour: totalHours > 0 ? (totalEarning / totalHours).toFixed(2) : 0,
    status: "pending",
  });

  res.status(201).json({
    message: "Bill generated successfully",
    earnings,
    summary: {
      totalTrips,
      totalDaysWorked,
      totalRent,
      totalBonus,
      payout,
    },
  });
});

// @desc    Get earnings for a driver
// @route   GET /api/earnings
// @access  Private
exports.getEarnings = asyncHandler(async (req, res) => {
  const { from, to, period = "monthly", page = 1, limit = 10 } = req.query;

  let filter = { driverId: req.user.id };

  if (from || to) {
    filter.fromDate = {};
    if (from) filter.fromDate.$gte = new Date(from);
    if (to) filter.fromDate.$lte = new Date(to);
  }

  if (period) filter.period = period;

  const total = await Earnings.countDocuments(filter);
  const earnings = await Earnings.find(filter)
    .sort({ fromDate: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: earnings,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get total earnings summary
// @route   GET /api/earnings/summary
// @access  Private
exports.getEarningsSummary = asyncHandler(async (req, res) => {
  const earnings = await Earnings.find({ driverId: req.user.id }).sort({ fromDate: -1 });

  const totalEarnings = earnings.reduce((sum, e) => sum + (e.totalEarning || 0), 0);
  const totalPayout = earnings.reduce((sum, e) => sum + (e.payout || 0), 0);
  const totalTrips = earnings.reduce((sum, e) => sum + (e.totalTrips || 0), 0);
  const totalDistance = earnings.reduce((sum, e) => sum + (e.totalDistance || 0), 0);
  const totalHours = earnings.reduce((sum, e) => sum + (e.totalHours || 0), 0);

  // This month earnings
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEarnings = earnings
    .filter((e) => e.fromDate >= thisMonth)
    .reduce((sum, e) => sum + (e.totalEarning || 0), 0);

  // This week earnings
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekEarnings = earnings
    .filter((e) => e.fromDate >= sevenDaysAgo)
    .reduce((sum, e) => sum + (e.totalEarning || 0), 0);

  res.json({
    success: true,
    data: {
      totalEarnings,
      totalPayout,
      totalTrips,
      totalDistance,
      totalHours,
      thisMonthEarnings,
      thisWeekEarnings,
      avgPerTrip: totalTrips > 0 ? (totalEarnings / totalTrips).toFixed(2) : 0,
      avgPerHour: totalHours > 0 ? (totalEarnings / totalHours).toFixed(2) : 0,
    },
  });
});

// @desc    Approve earnings for payment
// @route   PUT /api/earnings/:id/approve
// @access  Private/Admin
exports.approveEarnings = asyncHandler(async (req, res) => {
  const earnings = await Earnings.findByIdAndUpdate(
    req.params.id,
    { status: "approved" },
    { new: true }
  );

  if (!earnings) {
    return res.status(404).json({
      success: false,
      message: "Earnings not found",
    });
  }

  res.json({
    success: true,
    message: "Earnings approved",
    data: earnings,
  });
});

// @desc    Mark earnings as paid
// @route   PUT /api/earnings/:id/paid
// @access  Private/Admin
exports.markAsPaid = asyncHandler(async (req, res) => {
  const earnings = await Earnings.findByIdAndUpdate(
    req.params.id,
    { status: "paid", paidAt: new Date() },
    { new: true }
  );

  if (!earnings) {
    return res.status(404).json({
      success: false,
      message: "Earnings not found",
    });
  }

  res.json({
    success: true,
    message: "Earnings marked as paid",
    data: earnings,
  });
});

// @desc    Get all earnings (Admin)
// @route   GET /api/earnings/admin/all
// @access  Private/Admin
exports.getAllEarnings = asyncHandler(async (req, res) => {
  const { driverId, status, from, to, page = 1, limit = 10 } = req.query;

  let filter = {};

  if (driverId) filter.driverId = driverId;
  if (status) filter.status = status;

  if (from || to) {
    filter.fromDate = {};
    if (from) filter.fromDate.$gte = new Date(from);
    if (to) filter.fromDate.$lte = new Date(to);
  }

  const total = await Earnings.countDocuments(filter);
  const earnings = await Earnings.find(filter)
    .populate("driverId", "name phone email")
    .sort({ fromDate: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: earnings,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    },
  });
});