const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    driverSerial: {
      type: String,
      unique: true
    },
    name: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      required: true,
      unique: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },

    // New fields for driver registration
    age: {
      type: Number,
      required: true,
      min: 18,
      max: 70
    },

    experience: {
      type: Number,
      required: true,
      min: 0,
      max: 50 // years of experience
    },

    maritalStatus: {
      type: String,
      enum: ["single", "married", "divorced", "widowed"],
      default: "single"
    },

    // Document uploads
    aadharCard: {
      type: String, // Cloudinary URL
      required: true
    },

    drivingLicense: {
      type: String, // Cloudinary URL
      required: true
    },

    panCard: {
      type: String, // Cloudinary URL
      required: false // PAN might be optional for some regions, but we'll collect it
    },

    profilePhoto: {
      type: String, // Cloudinary URL
      required: false
    },

    documents: [{
      type: String, // Array of Cloudinary URLs for additional documents
    }],

    // Additional document metadata
    aadharNumber: {
      type: String,
      required: true
    },

    panNumber: {
      type: String,
      required: false
    },

    licenseNumber: {
      type: String,
      required: true
    },

    licenseExpiry: {
      type: Date,
      required: true
    },

    // Address information
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String
    },

    // Emergency contact
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    },

    role: {
      type: String,
      enum: ["admin", "driver"],
      default: "driver",
    },

    rentType: {
      type: String,
      enum: ["weekly", "monthly"],
      default: "weekly"
    },

    weeklyRent: {
      type: Number,
      default: 0
    },

    monthlyRent: {
      type: Number,
      default: 0
    },

    subscription: {
      type: Number,
      default: 0
    },

    isActive: {
      type: Boolean,
      default: true
    },

    // Verification status
    isVerified: {
      type: Boolean,
      default: false
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending"
    },

    onDuty: {
      type: Boolean,
      default: false
    },

    currentLocation: {
      lat: Number,
      lng: Number
    },

    refreshToken: {
      type: String,
    }

  },
  { timestamps: true }
);

driverSchema.pre('save', function(next) {
  if (!this.driverSerial) {
    // Generate a random 4 digit serial if missing
    this.driverSerial = 'DRV-' + Math.floor(1000 + Math.random() * 9000);
  }
  next();
});

// Index for better query performance
driverSchema.index({ phone: 1, email: 1 });
driverSchema.index({ isActive: 1, verificationStatus: 1 });

module.exports = mongoose.model("Driver", driverSchema);