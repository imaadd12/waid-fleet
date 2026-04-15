const Billing = require("../models/billingModel");
const Driver = require("../models/driverModel");
const Trip = require("../models/tripModel");
const Performance = require("../models/performanceModel");
const asyncHandler = require("express-async-handler");

// ==================== AUTO BILL GENERATION ====================
/**
 * @desc    Generate weekly bills for all active drivers
 * @route   GET /api/billing/generate/weekly
 * @access  Private/Admin
 */
exports.generateWeeklyBills = asyncHandler(async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const activeDrivers = await Driver.find({ isActive: true });
    const bills = [];

    for (const driver of activeDrivers) {
      // Check if bill already exists
      const existingBill = await Billing.findOne({
        driverId: driver._id,
        periodStartDate: { $gte: startOfWeek, $lte: startOfWeek },
        billType: "weekly"
      });

      if (existingBill) continue;

      // Get trips
      const trips = await Trip.find({
        driverId: driver._id,
        createdAt: { $gte: startOfWeek, $lte: endOfWeek },
        status: "completed"
      });

      // Calculate earnings
      const grossEarnings = trips.reduce((sum, trip) => sum + (trip.fare || 0), 0);
      const totalTrips = trips.length;
      const completedTrips = trips.filter(t => t.status === "completed").length;
      const averageEarningsPerTrip = totalTrips > 0 ? grossEarnings / totalTrips : 0;
      const averageEarningsPerDay = grossEarnings / 7;

      // Get deductions
      const vehicleRent = driver.weeklyRent || 0;
      const totalDeductions = vehicleRent; // Add other deductions as needed

      // Get bonuses
      const performance = await Performance.findOne({ driverId: driver._id });
      const performanceBonus = performance && performance.avgRating >= 4.5 ? grossEarnings * 0.05 : 0;

      // Calculate final amount
      const totalBonuses = performanceBonus;
      const netEarnings = grossEarnings - totalDeductions + totalBonuses;

      const bill = await Billing.create({
        driverId: driver._id,
        billType: "weekly",
        periodStartDate: startOfWeek,
        periodEndDate: endOfWeek,
        grossEarnings,
        totalTrips,
        completedTrips,
        vehicleRent,
        totalDeductions,
        performanceBonus,
        totalBonuses,
        netEarnings,
        averageEarningsPerTrip,
        averageEarningsPerDay,
        finalAmount: netEarnings,
        billStatus: "pending",
        paymentTerms: {
          dueDate: new Date(endOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000) // Due in 7 days
        }
      });

      bills.push(bill);
    }

    res.json({
      success: true,
      message: `Generated ${bills.length} weekly bills`,
      billsGenerated: bills.length,
      data: bills
    });
  } catch (error) {
    console.error("Error generating weekly bills:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Generate monthly bills for all active drivers
 * @route   GET /api/billing/generate/monthly
 * @access  Private/Admin
 */
exports.generateMonthlyBills = asyncHandler(async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const activeDrivers = await Driver.find({ isActive: true });
    const bills = [];

    for (const driver of activeDrivers) {
      // Check if bill already exists
      const existingBill = await Billing.findOne({
        driverId: driver._id,
        periodStartDate: { $gte: startOfMonth, $lte: startOfMonth },
        billType: "monthly"
      });

      if (existingBill) continue;

      // Get trips
      const trips = await Trip.find({
        driverId: driver._id,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        status: "completed"
      });

      // Calculate earnings
      const grossEarnings = trips.reduce((sum, trip) => sum + (trip.fare || 0), 0);
      const totalTrips = trips.length;
      const completedTrips = trips.filter(t => t.status === "completed").length;

      // Get deductions and bonuses
      const vehicleRent = (driver.weeklyRent || 0) * 4.33; // Monthly
      const totalDeductions = vehicleRent;

      const performance = await Performance.findOne({ driverId: driver._id });
      const performanceBonus = performance && performance.avgRating >= 4.5 ? grossEarnings * 0.1 : 0;
      const loyaltyBonus = driver.monthsWithCompany >= 6 ? grossEarnings * 0.02 : 0;
      const totalBonuses = performanceBonus + loyaltyBonus;

      // Calculate final amount
      const netEarnings = grossEarnings - totalDeductions + totalBonuses;

      const bill = await Billing.create({
        driverId: driver._id,
        billType: "monthly",
        periodStartDate: startOfMonth,
        periodEndDate: endOfMonth,
        grossEarnings,
        totalTrips,
        completedTrips,
        vehicleRent,
        totalDeductions,
        performanceBonus,
        loyaltyBonus,
        totalBonuses,
        netEarnings,
        finalAmount: netEarnings,
        billStatus: "pending",
        paymentTerms: {
          dueDate: new Date(endOfMonth.getTime() + 5 * 24 * 60 * 60 * 1000) // Due in 5 days
        }
      });

      bills.push(bill);
    }

    res.json({
      success: true,
      message: `Generated ${bills.length} monthly bills`,
      billsGenerated: bills.length,
      data: bills
    });
  } catch (error) {
    console.error("Error generating monthly bills:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== BILL MANAGEMENT ====================
/**
 * @desc    Get all bills with filters
 * @route   GET /api/billing/all
 * @access  Private/Admin
 */
exports.getAllBills = asyncHandler(async (req, res) => {
  const { status = "all", sortBy = "createdAt", page = 1, limit = 20 } = req.query;

  const filter = status !== "all" ? { billStatus: status } : {};
  const sortOptions = { [sortBy]: -1 };

  const total = await Billing.countDocuments(filter);
  const bills = await Billing.find(filter)
    .populate("driverId", "name phone email")
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: bills,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
  });
});

/**
 * @desc    Get bill by ID
 * @route   GET /api/billing/:billId
 * @access  Private
 */
exports.getBillById = asyncHandler(async (req, res) => {
  const bill = await Billing.findById(req.params.billId).populate("driverId", "name phone email");

  if (!bill) {
    return res.status(404).json({ success: false, message: "Bill not found" });
  }

  res.json({ success: true, data: bill });
});

/**
 * @desc    Get driver bills
 * @route   GET /api/billing/driver/:driverId
 * @access  Private
 */
exports.getDriverBills = asyncHandler(async (req, res) => {
  const { driverId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const total = await Billing.countDocuments({ driverId });
  const bills = await Billing.find({ driverId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: bills,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
  });
});

/**
 * @desc    Approve bill
 * @route   PUT /api/billing/:billId/approve
 * @access  Private/Admin
 */
exports.approveBill = asyncHandler(async (req, res) => {
  const bill = await Billing.findById(req.params.billId);

  if (!bill) {
    return res.status(404).json({ success: false, message: "Bill not found" });
  }

  bill.billStatus = "approved";
  bill.approvedBy = req.user.id;
  bill.approvalDate = new Date();

  bill.auditTrail.push({
    action: "Bill Approved",
    changedBy: req.user.id,
    changedAt: new Date(),
    reason: req.body.reason || "Admin approval"
  });

  await bill.save();

  res.json({ success: true, message: "Bill approved", data: bill });
});

/**
 * @desc    Cancel bill
 * @route   PUT /api/billing/:billId/cancel
 * @access  Private/Admin
 */
exports.cancelBill = asyncHandler(async (req, res) => {
  const bill = await Billing.findById(req.params.billId);

  if (!bill) {
    return res.status(404).json({ success: false, message: "Bill not found" });
  }

  if (bill.isPaid) {
    return res.status(400).json({ success: false, message: "Cannot cancel a paid bill" });
  }

  bill.billStatus = "canceled";
  bill.auditTrail.push({
    action: "Bill Canceled",
    changedBy: req.user.id,
    changedAt: new Date(),
    reason: req.body.reason || "Admin cancellation"
  });

  await bill.save();

  res.json({ success: true, message: "Bill canceled", data: bill });
});

// ==================== PAYMENT MANAGEMENT ====================
/**
 * @desc    Record payment
 * @route   POST /api/billing/:billId/payment
 * @access  Private/Admin
 */
exports.recordPayment = asyncHandler(async (req, res) => {
  const { amount, method, referenceNumber, notes } = req.body;
  const bill = await Billing.findById(req.params.billId);

  if (!bill) {
    return res.status(404).json({ success: false, message: "Bill not found" });
  }

  if (amount > bill.finalAmount - bill.totalPaid) {
    return res.status(400).json({ success: false, message: "Payment amount exceeds bill amount" });
  }

  bill.payments.push({
    amount,
    date: new Date(),
    method,
    referenceNumber,
    receivedBy: req.user.id,
    notes
  });

  bill.totalPaid += amount;
  bill.totalPending = bill.finalAmount - bill.totalPaid;

  if (bill.totalPaid >= bill.finalAmount) {
    bill.paymentStatus = "paid";
    bill.isPaid = true;
    bill.paidDate = new Date();
    bill.billStatus = "paid";
  } else {
    bill.paymentStatus = "partially_paid";
  }

  bill.auditTrail.push({
    action: "Payment Recorded",
    changedBy: req.user.id,
    changedAt: new Date(),
    changes: { amount, method },
    reason: "Payment received"
  });

  await bill.save();

  res.json({ success: true, message: "Payment recorded", data: bill });
});

/**
 * @desc    Get payment history
 * @route   GET /api/billing/:billId/payments
 * @access  Private
 */
exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const bill = await Billing.findById(req.params.billId);

  if (!bill) {
    return res.status(404).json({ success: false, message: "Bill not found" });
  }

  res.json({
    success: true,
    data: {
      billId: bill._id,
      finalAmount: bill.finalAmount,
      totalPaid: bill.totalPaid,
      totalPending: bill.totalPending,
      paymentStatus: bill.paymentStatus,
      payments: bill.payments
    }
  });
});

// ==================== DEDUCTIONS MANAGEMENT ====================
/**
 * @desc    Add deduction to bill
 * @route   POST /api/billing/:billId/deduction
 * @access  Private/Admin
 */
exports.addDeduction = asyncHandler(async (req, res) => {
  const { name, category, amount, description } = req.body;
  const bill = await Billing.findById(req.params.billId);

  if (!bill) {
    return res.status(404).json({ success: false, message: "Bill not found" });
  }

  bill.deductionItems.push({
    name,
    category,
    amount,
    description,
    approvedBy: req.user.id,
    approvalDate: new Date(),
    isApproved: true
  });

  bill.totalDeductions += amount;
  bill.finalAmount = bill.netEarnings - bill.totalDeductions;

  bill.auditTrail.push({
    action: "Deduction Added",
    changedBy: req.user.id,
    changedAt: new Date(),
    changes: { deduction: name, amount },
    reason: description
  });

  await bill.save();

  res.json({ success: true, message: "Deduction added", data: bill });
});

/**
 * @desc    Remove deduction from bill
 * @route   DELETE /api/billing/:billId/deduction/:deductionId
 * @access  Private/Admin
 */
exports.removeDeduction = asyncHandler(async (req, res) => {
  const bill = await Billing.findById(req.params.billId);

  if (!bill) {
    return res.status(404).json({ success: false, message: "Bill not found" });
  }

  const deduction = bill.deductionItems.id(req.params.deductionId);
  if (!deduction) {
    return res.status(404).json({ success: false, message: "Deduction not found" });
  }

  bill.totalDeductions -= deduction.amount;
  bill.deductionItems.pull(req.params.deductionId);
  bill.finalAmount = bill.netEarnings - bill.totalDeductions;

  bill.auditTrail.push({
    action: "Deduction Removed",
    changedBy: req.user.id,
    changedAt: new Date(),
    changes: { deduction: deduction.name, amount: deduction.amount }
  });

  await bill.save();

  res.json({ success: true, message: "Deduction removed", data: bill });
});

// ==================== BONUSES MANAGEMENT ====================
/**
 * @desc    Add bonus to bill
 * @route   POST /api/billing/:billId/bonus
 * @access  Private/Admin
 */
exports.addBonus = asyncHandler(async (req, res) => {
  const { type, name, amount, reason, category } = req.body;
  const bill = await Billing.findById(req.params.billId);

  if (!bill) {
    return res.status(404).json({ success: false, message: "Bill not found" });
  }

  bill.bonusItems.push({
    type,
    name,
    amount,
    reason,
    earnedOn: new Date(),
    category
  });

  bill.totalBonuses += amount;
  bill.netEarnings = bill.grossEarnings - bill.totalDeductions + bill.totalBonuses;
  bill.finalAmount = bill.netEarnings;

  bill.auditTrail.push({
    action: "Bonus Added",
    changedBy: req.user.id,
    changedAt: new Date(),
    changes: { bonus: name, amount },
    reason
  });

  await bill.save();

  res.json({ success: true, message: "Bonus added", data: bill });
});

// ==================== OVERDUE & COLLECTION ====================
/**
 * @desc    Get overdue bills
 * @route   GET /api/billing/overdue
 * @access  Private/Admin
 */
exports.getOverdueBills = asyncHandler(async (req, res) => {
  const now = new Date();

  const bills = await Billing.find({
    $expr: {
      $and: [
        { $lt: ["$paymentTerms.dueDate", now] },
        { $ne: ["$paymentStatus", "paid"] }
      ]
    }
  }).populate("driverId", "name phone email");

  // Update overdue status
  for (const bill of bills) {
    const daysOverdue = Math.floor((now - bill.paymentTerms.dueDate) / (1000 * 60 * 60 * 24));
    bill.isOverdue = true;
    bill.daysSinceOverdue = daysOverdue;

    // Calculate late fee
    const lateFeeDays = Math.max(0, daysOverdue - 3); // Grace period of 3 days
    const lateFeeAmount = (bill.finalAmount * bill.paymentTerms.lateFeePercent / 100) * (lateFeeDays / 30);
    bill.lateFee = lateFeeAmount;

    await bill.save();
  }

  res.json({ success: true, data: bills });
});

/**
 * @desc    Send payment reminders
 * @route   POST /api/billing/send-reminders
 * @access  Private/Admin
 */
exports.sendPaymentReminders = asyncHandler(async (req, res) => {
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const bills = await Billing.find({
    paymentStatus: { $ne: "paid" },
    $expr: {
      $and: [
        { $lte: ["$paymentTerms.dueDate", threeDaysFromNow] },
        { $gte: ["$paymentTerms.dueDate", now] }
      ]
    }
  }).populate("driverId");

  let remindersSent = 0;

  for (const bill of bills) {
    // TODO: Integrate SMS/Email service here
    bill.remindersSent += 1;
    bill.lastReminderDate = new Date();
    await bill.save();
    remindersSent++;
  }

  res.json({
    success: true,
    message: `Sent ${remindersSent} payment reminders`,
    remindersSent
  });
});

// ==================== FINANCIAL ANALYTICS ====================
/**
 * @desc    Get billing dashboard analytics
 * @route   GET /api/billing/analytics
 * @access  Private/Admin
 */
exports.getBillingAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const bills = await Billing.find({
    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
  });

  const totalEarnings = bills.reduce((sum, b) => sum + b.grossEarnings, 0);
  const totalDeductions = bills.reduce((sum, b) => sum + b.totalDeductions, 0);
  const totalBonuses = bills.reduce((sum, b) => sum + b.totalBonuses, 0);
  const totalBilled = bills.reduce((sum, b) => sum + b.finalAmount, 0);
  const totalCollected = bills.reduce((sum, b) => sum + b.totalPaid, 0);
  const outstandingAmount = totalBilled - totalCollected;

  const billedCount = bills.length;
  const paidBills = bills.filter(b => b.isPaid).length;
  const overdueBills = bills.filter(b => b.isOverdue).length;
  const pendingBills = billedCount - paidBills;

  res.json({
    success: true,
    data: {
      summary: {
        totalEarnings,
        totalDeductions,
        totalBonuses,
        totalBilled,
        totalCollected,
        outstandingAmount,
        collectionRate: ((totalCollected / totalBilled) * 100).toFixed(2)
      },
      counts: {
        billedCount,
        paidBills,
        pendingBills,
        overdueBills
      },
      metrics: {
        averageEarningsPerBill: (totalEarnings / billedCount).toFixed(2),
        averageDeductionPercent: ((totalDeductions / totalEarnings) * 100).toFixed(2),
        averageBonusPercent: ((totalBonuses / totalEarnings) * 100).toFixed(2)
      }
    }
  });
});

/**
 * @desc    Get driver earnings summary
 * @route   GET /api/billing/summary/:driverId
 * @access  Private
 */
exports.getEarningsSummary = asyncHandler(async (req, res) => {
  const { driverId } = req.params;

  const allBills = await Billing.find({ driverId });

  const totalEarned = allBills.reduce((sum, b) => sum + b.grossEarnings, 0);
  const totalDeducted = allBills.reduce((sum, b) => sum + b.totalDeductions, 0);
  const totalBonus = allBills.reduce((sum, b) => sum + b.totalBonuses, 0);
  const totalReceived = allBills.reduce((sum, b) => sum + b.totalPaid, 0);
  const totalPending = totalEarned - totalDeducted + totalBonus - totalReceived;

  const monthlyBills = allBills.filter(b => b.billType === "monthly");
  const weeklyBills = allBills.filter(b => b.billType === "weekly");

  res.json({
    success: true,
    data: {
      totalEarned,
      totalDeducted,
      totalBonus,
      netEarnings: totalEarned - totalDeducted + totalBonus,
      totalReceived,
      totalPending,
      billCounts: {
        monthly: monthlyBills.length,
        weekly: weeklyBills.length,
        total: allBills.length
      },
      averageEarningsPerBill: (totalEarned / allBills.length).toFixed(2)
    }
  });
});

/**
 * @desc    Get monthly revenue trends
 * @route   GET /api/billing/trends
 * @access  Private/Admin
 */
exports.getRevenueTrends = asyncHandler(async (req, res) => {
  const months = 12;
  const trends = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const bills = await Billing.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalEarnings = bills.reduce((sum, b) => sum + b.grossEarnings, 0);
    const totalCollected = bills.reduce((sum, b) => sum + b.totalPaid, 0);

    trends.push({
      month: date.toLocaleString("default", { month: "short", year: "numeric" }),
      earnings: totalEarnings,
      collected: totalCollected,
      billCount: bills.length
    });
  }

  res.json({ success: true, data: trends });
});

// ==================== REPORTS ====================
/**
 * @desc    Generate bill report
 * @route   GET /api/billing/:billId/report
 * @access  Private
 */
exports.generateBillReport = asyncHandler(async (req, res) => {
  const bill = await Billing.findById(req.params.billId).populate("driverId");

  if (!bill) {
    return res.status(404).json({ success: false, message: "Bill not found" });
  }

  const report = {
    billNumber: bill.billNumber,
    driver: bill.driverId.name,
    period: `${bill.periodStartDate.toDateString()} - ${bill.periodEndDate.toDateString()}`,
    billType: bill.billType,
    earnings: {
      gross: bill.grossEarnings,
      byCategory: bill.earningsByCategory
    },
    deductions: bill.deductionItems.map(d => ({ name: d.name, amount: d.amount })),
    totalDeductions: bill.totalDeductions,
    bonuses: bill.bonusItems.map(b => ({ name: b.name, amount: b.amount })),
    totalBonuses: bill.totalBonuses,
    netEarnings: bill.netEarnings,
    paymentStatus: bill.paymentStatus,
    totalPaid: bill.totalPaid,
    totalPending: bill.totalPending,
    generatedAt: new Date()
  };

  res.json({ success: true, data: report });
});
