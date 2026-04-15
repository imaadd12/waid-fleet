const asyncHandler = require("express-async-handler");
const Billing = require("../models/billingModel");
const Driver = require("../models/driverModel");
const Trip = require("../models/tripModel");

// @desc    Generate weekly bills for all active drivers
// @route   POST /api/billing/generate-weekly
// @access  Private (Admin only)
const generateWeeklyBills = asyncHandler(async (req, res) => {
  const activeDrivers = await Driver.find({ isActive: true });
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  const endDate = new Date();

  const results = { generated: 0, skipped: 0, errors: [] };

  for (const driver of activeDrivers) {
    try {
      // Check if bill already exists for this period
      const existingBill = await Billing.findOne({
        driverId: driver._id,
        periodStartDate: { $gte: startDate },
        periodEndDate: { $lte: endDate }
      });

      if (existingBill) {
        results.skipped++;
        continue;
      }

      // Calculate earnings (mock logic for prototype)
      const trips = await Trip.find({
        driverId: driver._id,
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      });

      const totalEarnings = trips.reduce((sum, t) => sum + (t.fare || 0), 0);
      const rent = driver.rentType === 'weekly' ? driver.weeklyRent : (driver.monthlyRent / 4);
      
      const netAmount = totalEarnings - rent;

      await Billing.create({
        driverId: driver._id,
        billType: 'weekly',
        periodStartDate: startDate,
        periodEndDate: endDate,
        grossEarnings: totalEarnings,
        vehicleRent: rent,
        finalAmount: netAmount,
        billStatus: netAmount < 0 ? 'overdue' : 'pending',
        isOverdue: netAmount < 0
      });

      results.generated++;
    } catch (err) {
      results.errors.push({ driver: driver.name, error: err.message });
    }
  }

  res.json({ success: true, message: `System processed ${activeDrivers.length} drivers.`, data: results });
});

// @desc    Get all bills with filtering
// @route   GET /api/billing
// @access  Private (Admin only)
const getBills = asyncHandler(async (req, res) => {
  const { status, isOverdue } = req.query;
  let query = {};
  if (status) query.billStatus = status;
  if (isOverdue === 'true') query.isOverdue = true;

  const bills = await Billing.find(query)
    .populate('driverId', 'name phone email driverSerial')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: bills });
});

// @desc    Approve/Pay a bill
// @route   PUT /api/billing/:id/pay
// @access  Private (Admin only)
const markAsPaid = asyncHandler(async (req, res) => {
  const bill = await Billing.findById(req.params.id);
  if (!bill) { res.status(404); throw new Error("Bill not found"); }

  bill.billStatus = 'paid';
  bill.isPaid = true;
  bill.paidDate = new Date();
  bill.isOverdue = false;
  
  await bill.save();
  res.json({ success: true, message: "Payment recorded successfully", data: bill });
});

module.exports = {
  generateWeeklyBills,
  getBills,
  markAsPaid
};