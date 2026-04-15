const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    plateNumber: { type: String, required: true, unique: true },
    type: { type: String, enum: ["sedan", "suv", "hatchback", "van", "truck"], required: true },
    color: { type: String },
    registrationNumber: { type: String, unique: true },
    registrationExpiry: { type: Date },
    insuranceExpiry: { type: Date },
    fuelType: { type: String, enum: ["petrol", "diesel", "electric", "hybrid"], default: "petrol" },
    mileage: { type: Number, default: 0 }, // in km
    lastServiceDate: { type: Date },
    nextServiceDue: { type: Date },
    status: { 
      type: String, 
      enum: ["active", "inactive", "maintenance", "retired"],
      default: "active"
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null
    },
    documents: {
      rc: String, // registration certificate
      insurance: String,
      pollution: String,
      fitness: String
    },
    maintenanceHistory: [{
      date: { type: Date, default: Date.now },
      type: String,
      description: String,
      cost: Number
    }],
    tripCount: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Index for faster queries
vehicleSchema.index({ assignedDriver: 1 });
vehicleSchema.index({ status: 1 });

module.exports = mongoose.model("Vehicle", vehicleSchema);