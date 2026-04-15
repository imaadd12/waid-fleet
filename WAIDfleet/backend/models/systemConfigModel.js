const mongoose = require("mongoose");

const systemConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "global_settings"
    },
    adminAbsent: {
      type: Boolean,
      default: false
    },
    defaultWeeklyRent: {
      type: Number,
      default: 5000
    },
    lateFeePercentage: {
      type: Number,
      default: 5
    },
    accidentPushAlerts: {
      type: Boolean,
      default: true
    },
    // Pricing & Business Settings
    baseFare: {
      type: Number,
      default: 50
    },
    perKmRate: {
      type: Number,
      default: 15
    },
    surgeMultiplier: {
      type: Number,
      default: 1.0
    },
    driverCommissionPercentage: {
      type: Number,
      default: 20
    },
    // System & Localization
    currency: {
      type: String,
      default: "INR"
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata"
    },
    language: {
      type: String,
      default: "en"
    },
    // Global Notifications
    notificationToggles: {
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      email: { type: Boolean, default: true }
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("SystemConfig", systemConfigSchema);
