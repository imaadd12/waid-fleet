const mongoose = require("mongoose");

const partSchema = new mongoose.Schema({
  partName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitCost: { type: Number, required: true, min: 0 },
}, { _id: false });

const incidentSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },
    type: {
      type: String,
      enum: [
        "accident",
        "speeding",
        "violation",
        "complaint",
        "late_cancellation",
        "no_show",
        "vehicle_damage",
        "rude_behavior",
        "other"
      ],
      required: true,
    },
    description: { type: String, required: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["reported", "under_review", "resolved", "closed"],
      default: "reported",
    },
    reportedBy: { type: String },
    evidenceUrl: [{ type: String }],
    resolution: { type: String },
    resolvedAt: { type: Date },
    safetyScore: { type: Number, default: 0, min: 0, max: 100 },
    notes: { type: String },

    // Repair tracking
    repairCompleted: { type: Boolean, default: false },
    repairedDate: { type: Date },
    partsUsed: [partSchema],
    totalRepairCost: { type: Number, default: 0 },
    repairNotes: { type: String },
    payrollDeducted: { type: Boolean, default: false },
    payrollDeductionAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for better performance
incidentSchema.index({ driverId: 1, status: 1 });
incidentSchema.index({ severity: 1 });

module.exports = mongoose.model("Incident", incidentSchema);
