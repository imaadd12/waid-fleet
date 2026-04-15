const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    status: { 
      type: String, 
      enum: ["ongoing", "completed", "cancelled"], 
      default: "ongoing" 
    },
    totalTrips: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    totalDistance: { type: Number, default: 0 }, // in km
    totalHours: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true }
);

// Index for better performance
shiftSchema.index({ driverId: 1, status: 1 });
shiftSchema.index({ startTime: 1 });

module.exports = mongoose.model("Shift", shiftSchema);
