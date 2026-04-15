const Payment = require("../models/paymentModel");
const asyncHandler = require("express-async-handler");

// @desc    Create a payment record
// @route   POST /api/payments
// @access  Private/Admin
exports.createPayment = asyncHandler(async (req, res) => {
  const { driverId, amount, method, description, paymentType, reference, transactionId } =
    req.body;

  if (!driverId || !amount) {
    return res.status(400).json({
      success: false,
      message: "Driver ID and amount are required",
    });
  }

  const payment = await Payment.create({
    driverId,
    amount,
    method: method || "bank_transfer",
    description: description || "",
    paymentType: paymentType || "salary",
    reference: reference || "",
    transactionId: transactionId || `TXN-${Date.now()}`,
    status: "pending",
  });

  res.status(201).json({
    success: true,
    message: "Payment created",
    data: payment,
  });
});

// @desc    Get payment history for a driver
// @route   GET /api/payments
// @access  Private
exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const { status, from, to, page = 1, limit = 10, paymentType } = req.query;

  let filter = { driverId: req.user.id };

  if (status) filter.status = status;
  if (paymentType) filter.paymentType = paymentType;

  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const total = await Payment.countDocuments(filter);
  const payments = await Payment.find(filter)
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  res.json({
    success: true,
    data: payments,
    summary: {
      total,
      totalAmount,
    },
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
exports.getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate("driverId", "name phone email");

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Payment not found",
    });
  }

  // Check authorization
  if (payment.driverId._id.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to view this payment",
    });
  }

  res.json({
    success: true,
    data: payment,
  });
});

// @desc    Update payment status
// @route   PUT /api/payments/:id
// @access  Private/Admin
exports.updatePaymentStatus = asyncHandler(async (req, res) => {
  const { status, completedAt, reference, note } = req.body;

  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Payment not found",
    });
  }

  if (status) {
    payment.status = status;
    if (status === "completed" || status === "refunded") {
      payment.completedAt = completedAt || new Date();
    }
  }

  if (reference) payment.reference = reference;
  if (note) payment.note = note;

  await payment.save();

  res.json({
    success: true,
    message: "Payment updated",
    data: payment,
  });
});

// @desc    Get all payments (Admin)
// @route   GET /api/payments/admin/all
// @access  Private/Admin
exports.getAllPayments = asyncHandler(async (req, res) => {
  const { driverId, status, paymentType, from, to, page = 1, limit = 10 } = req.query;

  let filter = {};

  if (driverId) filter.driverId = driverId;
  if (status) filter.status = status;
  if (paymentType) filter.paymentType = paymentType;

  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const total = await Payment.countDocuments(filter);
  const payments = await Payment.find(filter)
    .populate("driverId", "name phone email")
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  res.json({
    success: true,
    data: payments,
    summary: {
      total,
      totalAmount,
    },
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get payment statistics (Admin)
// @route   GET /api/payments/admin/stats
// @access  Private/Admin
exports.getPaymentStats = asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  let filter = {};

  if (from || to) {
    filter.completedAt = {};
    if (from) filter.completedAt.$gte = new Date(from);
    if (to) filter.completedAt.$lte = new Date(to);
  }

  // Total by status
  const byStatus = await Payment.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  // Total by type
  const byType = await Payment.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$paymentType",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  // Total by method
  const byMethod = await Payment.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$method",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      byStatus,
      byType,
      byMethod,
    },
  });
});

// @desc    Process bulk payments
// @route   POST /api/payments/admin/bulk
// @access  Private/Admin
exports.processBulkPayments = asyncHandler(async (req, res) => {
  const { earnings } = req.body; // Array of earnings IDs

  if (!earnings || earnings.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Earnings IDs are required",
    });
  }

  const payments = [];

  for (const earningId of earnings) {
    const Earnings = require("../models/earningsModel");
    const earning = await Earnings.findById(earningId);

    if (earning && earning.status === "approved") {
      const payment = await Payment.create({
        driverId: earning.driverId,
        amount: earning.payout,
        method: "bank_transfer",
        description: `Payout for ${earning.fromDate} to ${earning.toDate}`,
        paymentType: "salary",
        reference: `EARN-${earning._id}`,
        status: "completed",
        completedAt: new Date(),
      });

      await Earnings.findByIdAndUpdate(earningId, { status: "paid", paidAt: new Date() });
      payments.push(payment);
    }
  }

  res.status(201).json({
    success: true,
    message: `${payments.length} payments processed`,
    data: payments,
  });
});
