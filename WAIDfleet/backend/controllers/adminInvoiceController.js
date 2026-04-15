const Billing = require("../models/billingModel");
const Trip = require("../models/tripModel");
const Driver = require("../models/driverModel");
const asyncHandler = require("express-async-handler");

// @desc    Preview driver invoice data before generation
// @route   GET /api/admin/invoice/preview/:serialNumber
// @access  Private (Admin)
exports.getDriverInvoicePreview = asyncHandler(async (req, res) => {
  const { serialNumber } = req.params;
  
  // Find driver via serial or fallback to phone
  const driver = await Driver.findOne({
    $or: [{ driverSerial: serialNumber }, { phone: serialNumber }]
  });

  if (!driver) {
    return res.status(404).json({ message: "Driver not found with that serial number." });
  }

  // Find unbilled completed trips
  const unbilledTrips = await Trip.find({
    driverId: driver._id,
    status: "completed",
    isBilled: false
  });

  const totalTrips = unbilledTrips.length;
  const grossEarnings = unbilledTrips.reduce((acc, trip) => acc + (trip.fare || 0), 0);
  const tollRefundGross = unbilledTrips.reduce((acc, trip) => acc + (trip.toll || 0), 0);

  res.json({
    success: true,
    data: {
      driver: {
        _id: driver._id,
        name: driver.name,
        phone: driver.phone,
        serial: driver.driverSerial || serialNumber,
        rentType: driver.rentType,
        weeklyRent: driver.weeklyRent || 0,
      },
      stats: {
        totalTrips,
        grossEarnings,
        tollRefund: tollRefundGross,
      }
    }
  });
});

// @desc    Generate and commit the specialized admin invoice
// @route   POST /api/admin/invoice/generate/:serialNumber
// @access  Private (Admin)
exports.generateAdminInvoice = asyncHandler(async (req, res) => {
  const { serialNumber } = req.params;
  const { 
    totalEarnings, 
    payoutRatio, // commission inverted
    totalTrips, 
    personalWallet, 
    totalRent, 
    numberOfDays, 
    tollRefund, 
    vehiclesCount, 
    finalBalance 
  } = req.body;

  const driver = await Driver.findOne({
    $or: [{ driverSerial: serialNumber }, { phone: serialNumber }]
  });

  if (!driver) {
    return res.status(404).json({ message: "Driver not found." });
  }

  // Create Bill
  const invoice = await Billing.create({
    driverId: driver._id,
    billType: "custom",
    periodStartDate: new Date(new Date().setDate(new Date().getDate() - numberOfDays)),
    periodEndDate: new Date(),
    billStatus: "approved",
    grossEarnings: totalEarnings,
    completedTrips: totalTrips,
    totalTrips: totalTrips,
    commissionAmount: personalWallet, // Storing wallet adjustments here
    vehicleRent: totalRent,
    totalDeductions: totalRent,
    tollRefund: tollRefund,
    finalAmount: finalBalance,
    dueDate: new Date(),
    internalNotes: `Processed via Admin Engine for ${vehiclesCount} active vehicles. Days: ${numberOfDays}. Payout ratio set to ${payoutRatio}%.`
  });

  // Mark all currently unbilled completed trips as billed
  await Trip.updateMany(
    { driverId: driver._id, status: "completed", isBilled: false },
    { $set: { isBilled: true } }
  );

  res.status(201).json({
    success: true,
    data: invoice,
    message: "Automated statement has been officially generated and locked."
  });
});

// @desc    List recent admin-generated invoices
// @route   GET /api/billing/admin/invoice/recent
// @access  Private (Admin)
exports.getRecentAdminInvoices = asyncHandler(async (req, res) => {
  const invoices = await Billing.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('driverId', 'name phone driverSerial');

  res.json({ success: true, count: invoices.length, data: invoices });
});

