const mongoose = require("mongoose");

const billingSchema = new mongoose.Schema(
  {
    // ==================== BASIC INFO ====================
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true
    },
    billNumber: {
      type: String,
      unique: true
    },
    billType: {
      type: String,
      enum: ["weekly", "monthly", "quarterly", "custom"],
      default: "weekly"
    },
    periodStartDate: {
      type: Date,
      required: true
    },
    periodEndDate: {
      type: Date,
      required: true
    },
    billStatus: {
      type: String,
      enum: ["draft", "pending", "approved", "sent", "partially_paid", "paid", "overdue", "canceled"],
      default: "pending"
    },
    driverStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },

    // ==================== EARNINGS ====================
    grossEarnings: { type: Number, default: 0 },
    totalTrips: { type: Number, default: 0 },
    completedTrips: { type: Number, default: 0 },
    cancelledTrips: { type: Number, default: 0 },
    peakHoursEarnings: { type: Number, default: 0 },
    bonusEarnings: { type: Number, default: 0 },
    referralEarnings: { type: Number, default: 0 },
    promotionalEarnings: { type: Number, default: 0 },
    cancellationCharges: { type: Number, default: 0 },
    longRideBonus: { type: Number, default: 0 },
    
    // Earnings breakdown by category
    earningsByCategory: {
      regular: { type: Number, default: 0 },
      surge: { type: Number, default: 0 },
      bonus: { type: Number, default: 0 },
      referral: { type: Number, default: 0 }
    },

    // ==================== DEDUCTIONS ====================
    totalDeductions: { type: Number, default: 0 },
    deductionItems: [{
      name: String,
      category: { type: String, enum: ["rent", "fuel", "maintenance", "insurance", "penalty", "toll", "parking", "admin_fee", "training", "uniform", "other"] },
      amount: Number,
      description: String,
      approvedBy: mongoose.Schema.Types.ObjectId,
      approvalDate: Date,
      isApproved: { type: Boolean, default: false }
    }],
    
    // Common deductions
    vehicleRent: { type: Number, default: 0 },
    fuelCharges: { type: Number, default: 0 },
    maintenanceCharges: { type: Number, default: 0 },
    insurancePremium: { type: Number, default: 0 },
    gpsTrackerFee: { type: Number, default: 0 },
    administrativeFee: { type: Number, default: 0 },
    tollCharges: { type: Number, default: 0 },
    parkingCharges: { type: Number, default: 0 },
    penaltyDeductions: { type: Number, default: 0 },
    advanceSalaryDeduction: { type: Number, default: 0 },
    loanEMIDeduction: { type: Number, default: 0 },
    damagesDeduction: { type: Number, default: 0 },
    commissionPercentage: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },

    // ==================== INCENTIVES & BONUSES ====================
    totalBonuses: { type: Number, default: 0 },
    bonusItems: [{
      type: String,
      name: String,
      amount: Number,
      reason: String,
      earnedOn: Date,
      category: { type: String, enum: ["performance", "loyalty", "referral", "milestone", "safety", "punctuality", "other"] }
    }],
    
    // Specific bonuses
    performanceBonus: { type: Number, default: 0 },
    tripCompletionBonus: { type: Number, default: 0 },
    safetyBonus: { type: Number, default: 0 },
    punctualityBonus: { type: Number, default: 0 },
    customerSatisfactionBonus: { type: Number, default: 0 },
    referralBonusAmount: { type: Number, default: 0 },
    loyaltyBonus: { type: Number, default: 0 },
    milestoneBonus: { type: Number, default: 0 },

    // ==================== TAXES ====================
    totalTaxes: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    tdsDeduction: { type: Number, default: 0 },

    // ==================== SUMMARY ====================
    netEarnings: { type: Number, default: 0 }, // After deductions & taxes
    advance: { type: Number, default: 0 }, // If any advance given
    adjustments: { type: Number, default: 0 }, // Manual adjustments
    previousBalance: { type: Number, default: 0 }, // Carried forward from previous bill
    creditBalance: { type: Number, default: 0 }, // Overpayment/credit
    finalAmount: { type: Number, default: 0 }, // Amount due
    tollRefund: { type: Number, default: 0 },

    // ==================== PAYMENT TRACKING ====================
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partially_paid", "paid"],
      default: "unpaid"
    },
    payments: [{
      amount: Number,
      date: Date,
      method: { type: String, enum: ["cash", "bank_transfer", "check", "wallet", "online"] },
      referenceNumber: String,
      receivedBy: mongoose.Schema.Types.ObjectId,
      notes: String
    }],
    totalPaid: { type: Number, default: 0 },
    totalPending: { type: Number, default: 0 },
    
    paymentTerms: {
      dueDate: Date,
      gracePeriod: { type: Number, default: 3 }, // days
      lateFeePercent: { type: Number, default: 5 },
      earlyPaymentDiscount: { type: Number, default: 0 }
    },

    // ==================== PAYMENT PLAN ====================
    paymentPlan: [{
      dueDate: Date,
      amount: Number,
      status: { type: String, enum: ["pending", "paid"], default: "pending" },
      paidDate: Date
    }],

    // ==================== OVERDUE & LATE FEES ====================
    isPaid: {
      type: Boolean,
      default: false
    },
    paidDate: Date,
    isOverdue: { type: Boolean, default: false },
    daysSinceOverdue: { type: Number, default: 0 },
    lateFee: { type: Number, default: 0 },
    remindersSent: { type: Number, default: 0 },
    lastReminderDate: Date,

    // ==================== FINANCIAL METRICS ====================
    averageEarningsPerDay: { type: Number, default: 0 },
    averageEarningsPerTrip: { type: Number, default: 0 },
    deductionPercent: { type: Number, default: 0 }, // % of gross

    // ==================== AUDIT TRAIL ====================
    auditTrail: [{
      action: String,
      changedBy: mongoose.Schema.Types.ObjectId,
      changedAt: { type: Date, default: Date.now },
      changes: mongoose.Schema.Types.Mixed,
      reason: String
    }],

    // ==================== DISPUTES ====================
    disputes: [{
      raisedBy: mongoose.Schema.Types.ObjectId,
      reason: String,
      status: { type: String, enum: ["open", "in_review", "resolved", "closed"], default: "open" },
      raisedDate: Date,
      resolution: String,
      resolvedBy: mongoose.Schema.Types.ObjectId,
      resolvedDate: Date
    }],

    // ==================== METADATA ====================
    notes: String,
    internalNotes: String,
    approvedBy: mongoose.Schema.Types.ObjectId,
    approvalDate: Date,
    sentDate: Date,
    billGeneratorVersion: String,
  },
  { timestamps: true }
);

// Generate bill number before saving
billingSchema.pre('save', function(next) {
  if (!this.billNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.billNumber = `BILL-${year}${month}-${random}`;
  }
  next();
});

// Indexes
billingSchema.index({ driverId: 1, periodStartDate: -1 });
billingSchema.index({ billStatus: 1 });
billingSchema.index({ isOverdue: 1 });
billingSchema.index({ paymentStatus: 1 });
billingSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Billing", billingSchema);