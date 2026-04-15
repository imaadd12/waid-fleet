const mongoose = require("mongoose");

// Wallet Schema
const walletSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
    unique: true,
    index: true
  },
  balance: { type: Number, default: 0, min: 0 },
  totalEarned: { type: Number, default: 0, min: 0 },
  totalSpent: { type: Number, default: 0, min: 0 },
  totalWithdrawn: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: "INR", enum: ["INR", "USD", "EUR", "GBP"] },
  isActive: { type: Boolean, default: true },
  lastTransactionDate: Date,
  walletLocking: {
    isLocked: { type: Boolean, default: false },
    lockedUntil: Date,
    reason: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Subscription Plan Schema
const subscriptionPlanSchema = new mongoose.Schema({
  planName: { type: String, required: true, unique: true, trim: true },
  type: { type: String, enum: ["basic", "pro", "enterprise", "premium"], required: true },
  monthlyFee: { type: Number, required: true, min: 0 },
  annualFee: { type: Number, min: 0 },
  commissionRate: { type: Number, required: true, min: 0, max: 100 },
  features: [{
    name: String,
    enabled: { type: Boolean, default: true }
  }],
  limits: {
    maxTripsPerDay: Number,
    maxEarningsPerMonth: Number,
    maxWithdrawalsPerMonth: Number
  },
  benefits: {
    prioritySupport: { type: Boolean, default: false },
    insuranceCoverage: Number,
    bonusPercentage: { type: Number, default: 0 },
    cancelBookingLimit: Number
  },
  description: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Payment Method Schema
const paymentMethodSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
    index: true
  },
  type: { type: String, enum: ["card", "bank", "upi", "wallet", "paypal"], required: true },
  provider: { type: String, enum: ["stripe", "razorpay", "paypal", "internal"], required: true },
  providerPaymentMethodId: { type: String, required: true, unique: true },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  cardDetails: {
    lastFour: String,
    brand: String,
    expiryMonth: Number,
    expiryYear: Number,
    holderName: String
  },
  bankDetails: {
    accountHolderName: String,
    bankName: String,
    accountType: String,
    accountNumber: String,
    ifscCode: String,
    lastFour: String
  },
  upiDetails: {
    upiId: String,
    name: String
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true, index: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true, index: true },
  type: { type: String, enum: ["credit", "debit", "refund", "adjustment", "bonus", "penalty", "payout"], required: true },
  category: { type: String, enum: ["earnings", "payment", "withdrawal", "subscription", "bonus", "penalty", "adjustment"], required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["pending", "processing", "completed", "failed", "reversed"], default: "pending", index: true },
  paymentMethod: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentMethod" },
  provider: String,
  providerTransactionId: String,
  description: String,
  relatedEntity: {
    type: String,
    enum: ["trip", "subscription", "wallet_recharge", "payout", "bonus", "penalty"]
  },
  metadata: mongoose.Schema.Types.Mixed,
  fees: {
    platformFee: { type: Number, default: 0 },
    gatewayFee: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 }
  },
  netAmount: { type: Number, required: true },
  walletBalanceBefore: Number,
  walletBalanceAfter: Number,
  notes: String,
  createdAt: { type: Date, default: Date.now, index: true },
  completedAt: Date
});

// Automated Payout Schema
const automatedPayoutSchema = new mongoose.Schema({
  payoutBatchId: { type: String, required: true, unique: true },
  frequency: { type: String, enum: ["daily", "weekly", "biweekly", "monthly"], required: true },
  payoutDate: { type: Date, required: true, index: true },
  payouts: [{
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
    amount: Number,
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    paymentMethodId: mongoose.Schema.Types.ObjectId,
    transactionId: String,
    failureReason: String,
    processedAt: Date
  }],
  summary: {
    totalAmount: { type: Number, default: 0 },
    totalDrivers: { type: Number, default: 0 },
    successfulPayouts: { type: Number, default: 0 },
    failedPayouts: { type: Number, default: 0 },
    totalFees: { type: Number, default: 0 }
  },
  status: { type: String, enum: ["scheduled", "processing", "completed", "failed"], default: "scheduled", index: true },
  nextPayoutDate: Date,
  createdAt: { type: Date, default: Date.now },
  processedAt: Date,
  notes: String
});

// Driver Subscription Schema
const driverSubscriptionSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true, unique: true, index: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
  subscriptionStartDate: { type: Date, default: Date.now },
  subscriptionEndDate: { type: Date, required: true },
  billingCycle: { type: String, enum: ["monthly", "annual"], default: "monthly" },
  status: { type: String, enum: ["active", "pending", "cancelled", "expired", "suspended"], default: "active", index: true },
  autoRenewal: { type: Boolean, default: true },
  lastPaymentDate: Date,
  nextPaymentDate: Date,
  trialPeriod: {
    isInTrial: { type: Boolean, default: false },
    trialEndDate: Date
  },
  usageData: {
    tripsUsed: { type: Number, default: 0 },
    earningsAccumulated: { type: Number, default: 0 },
    withdrawalsUsed: { type: Number, default: 0 }
  },
  cancellationReason: String,
  cancelledDate: Date,
  createdAt: { type: Date, default: Date.now }
});

// Original Payment Schema (kept for backward compatibility)
const paymentSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ["cash", "upi", "card", "bank_transfer"], default: "cash" },
  status: { type: String, enum: ["pending", "completed", "failed", "refunded"], default: "pending" },
  transactionId: { type: String, unique: true, sparse: true },
  reference: { type: String },
  description: { type: String },
  paymentType: { type: String, enum: ["salary", "advance", "bonus", "incentive", "refund"], default: "salary" },
  date: { type: Date, default: Date.now },
  completedAt: { type: Date },
  note: { type: String }
}, { timestamps: true });

// Create indexes
subscriptionPlanSchema.index({ type: 1, isActive: 1 });
paymentMethodSchema.index({ driverId: 1, isDefault: 1 });
transactionSchema.index({ driverId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
automatedPayoutSchema.index({ payoutDate: 1, status: 1 });
driverSubscriptionSchema.index({ status: 1, subscriptionEndDate: 1 });
paymentSchema.index({ driverId: 1, date: -1 });
paymentSchema.index({ status: 1 });

module.exports = {
  Payment: mongoose.model("Payment", paymentSchema),
  Wallet: mongoose.model("Wallet", walletSchema),
  SubscriptionPlan: mongoose.model("SubscriptionPlan", subscriptionPlanSchema),
  PaymentMethod: mongoose.model("PaymentMethod", paymentMethodSchema),
  Transaction: mongoose.model("Transaction", transactionSchema),
  AutomatedPayout: mongoose.model("AutomatedPayout", automatedPayoutSchema),
  DriverSubscription: mongoose.model("DriverSubscription", driverSubscriptionSchema)
};