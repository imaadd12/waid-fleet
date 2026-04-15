const mongoose = require("mongoose");

const zoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
    },
    description: {
      type: String,
    },
    color: {
      type: String,
      default: "#6366f1",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    assignedDrivers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
      },
    ],
    assignedVehicles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
      },
    ],
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
    },
  },
  { timestamps: true }
);

zoneSchema.index({ city: 1 });
zoneSchema.index({ isActive: 1 });

module.exports = mongoose.model("Zone", zoneSchema);
