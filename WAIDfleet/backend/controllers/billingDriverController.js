const Billing = require("../models/billingModel");
const Trip = require("../models/tripModel");
const Driver = require("../models/driverModel");
const asyncHandler = require("express-async-handler");

// @desc    Generate a new invoice/bill from unbilled trips
// @route   POST /api/billing/driver/generate
// @access  Private (Driver)
exports.generateDriverInvoice = asyncHandler(async (req, res) => {
  const driverId = req.user.id;

  // Find all unbilled, completed trips
  const unbilledTrips = await Trip.find({
    driverId,
    status: "completed",
    isBilled: false
  });

  if (!unbilledTrips || unbilledTrips.length === 0) {
    return res.status(400).json({ message: "No unbilled trips found to generate an invoice." });
  }

  // Calculate gross earnings from trips
  const grossEarnings = unbilledTrips.reduce((acc, trip) => acc + (trip.fare || 0), 0);
  const totalTrips = unbilledTrips.length;

  // Assume platform takes 10% commission automatically
  const commissionPercentage = 10;
  const commissionAmount = (grossEarnings * commissionPercentage) / 100;
  
  const netEarnings = grossEarnings - commissionAmount;

  // Get driver Details to sync with billing logic
  const driver = await Driver.findById(driverId);
  const rentDeduction = driver?.weeklyRent || 0;

  // Create formal Billing Document
  const invoice = await Billing.create({
    driverId,
    billType: "custom",
    periodStartDate: unbilledTrips[0].endTime || new Date(),
    periodEndDate: new Date(),
    billStatus: "pending",
    grossEarnings: grossEarnings,
    completedTrips: totalTrips,
    totalTrips: totalTrips,
    commissionPercentage: commissionPercentage,
    commissionAmount: commissionAmount,
    vehicleRent: rentDeduction,
    totalDeductions: commissionAmount + rentDeduction,
    netEarnings: netEarnings - rentDeduction,
    finalAmount: netEarnings - rentDeduction, // Amount due to driver
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Due in 7 days
  });

  // Mark trips as billed
  const tripIds = unbilledTrips.map(t => t._id);
  await Trip.updateMany(
    { _id: { $in: tripIds } },
    { $set: { isBilled: true } }
  );

  res.status(201).json({
    success: true,
    data: invoice,
    message: `Invoice generated for ${totalTrips} trips.`
  });
});

// @desc    Get all generated invoices for the logged in driver
// @route   GET /api/billing/driver/me
// @access  Private (Driver)
exports.getMyBills = asyncHandler(async (req, res) => {
  const driverId = req.user.id;

  const bills = await Billing.find({ driverId }).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: bills.length,
    data: bills
  });
});
