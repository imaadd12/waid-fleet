const mongoose = require("mongoose");

const fuelLogSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    fuelAmount: {
      type: Number,
      required: true,
    },
    fuelCost: {
      type: Number,
      required: true,
    },
    odometer: {
      type: Number,
    },
    fuelType: {
      type: String,
      enum: ["petrol", "diesel", "electric", "cng"],
    },
    station: {
      type: String,
    },
    notes: {
      type: String,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
    },
  },
  { timestamps: true }
);

fuelLogSchema.index({ vehicleId: 1 });
fuelLogSchema.index({ driverId: 1 });
fuelLogSchema.index({ date: -1 });

module.exports = mongoose.model("FuelLog", fuelLogSchema);
