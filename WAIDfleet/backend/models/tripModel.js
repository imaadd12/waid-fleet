const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: false,
    },
    isBilled: { type: Boolean, default: false },
    fare: { type: Number, default: 0 },
    toll: { type: Number, default: 0 },
    status: { 
      type: String, 
      enum: ["requested", "assigned", "arrived_pickup", "in_progress", "completed", "cancelled"], 
      default: "requested" 
    },
    passengerDetails: {
      name: String,
      phone: String
    },
    startTime: { type: Date },
    endTime: { type: Date },
    pickupLocation: {
      address: String,
      latitude: Number,
      longitude: Number,
    },
    dropLocation: {
      address: String,
      latitude: Number,
      longitude: Number,
    },
    distance: { type: Number, default: 0 }, // in km
    duration: { type: Number, default: 0 }, // in minutes
    rating: { type: Number, min: 1, max: 5 }, // customer rating
    review: { type: String }, // customer feedback
    feedback: {
      cleanliness: { type: Boolean },
      safety: { type: Boolean },
      communication: { type: Boolean },
      drivingSkill: { type: Boolean },
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for better performance
tripSchema.index({ driverId: 1, status: 1 });
tripSchema.index({ date: -1 });

module.exports = mongoose.model("Trip", tripSchema);