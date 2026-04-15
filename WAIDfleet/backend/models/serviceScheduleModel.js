const mongoose = require("mongoose");

const serviceScheduleSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true
    },
    serviceType: {
      type: String,
      enum: ["routine", "major", "oil_change", "tire_rotation", "inspection", "other"],
      default: "routine"
    },
    description: String,
    lastServiceDate: Date,
    nextServiceDate: {
      type: Date,
      required: true
    },
    frequency: {
      type: String,
      enum: ["monthly", "quarterly", "biannual", "annual", "custom"],
      default: "monthly"
    },
    estimatedCost: Number,
    status: {
      type: String,
      enum: ["scheduled", "completed", "overdue", "cancelled"],
      default: "scheduled"
    },
    notificationSent: {
      type: Boolean,
      default: false
    },
    notificationSentDate: Date,
    reminderDaysBefore: {
      type: Number,
      default: 7 // Send reminder 7 days before service
    },
    completedDate: Date,
    notes: String,
    serviceProvider: String, // Name of service center
    estimateFile: String, // URL to estimate document
    invoiceFile: String // URL to invoice document
  },
  { timestamps: true }
);

// Index for faster queries
serviceScheduleSchema.index({ vehicleId: 1, driverId: 1 });
serviceScheduleSchema.index({ nextServiceDate: 1 });
serviceScheduleSchema.index({ status: 1 });

module.exports = mongoose.model("ServiceSchedule", serviceScheduleSchema);
