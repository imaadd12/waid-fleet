const mongoose = require("mongoose");

const earningsSchema = new mongoose.Schema(
  {
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    period: { type: String, enum: ["daily", "weekly", "monthly"], default: "daily" },
    totalEarning: { type: Number, default: 0 },
    totalTrips: { type: Number, default: 0 },
    totalToll: { type: Number, default: 0 },
    totalRent: { type: Number, default: 0 },
    totalBonus: { type: Number, default: 0 },
    totalIncentives: { type: Number, default: 0 },
    subscription: { type: Number, default: 0 },
    advance: { type: Number, default: 0 },
    payout: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    totalDistance: { type: Number, default: 0 }, // in km
    totalHours: { type: Number, default: 0 },
    avgEarningPerTrip: { type: Number, default: 0 },
    avgEarningPerHour: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "approved", "paid"], default: "pending" },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

// Index for better performance
earningsSchema.index({ driverId: 1, period: 1 });
earningsSchema.index({ fromDate: 1, toDate: 1 });

module.exports = mongoose.model("Earnings", earningsSchema);