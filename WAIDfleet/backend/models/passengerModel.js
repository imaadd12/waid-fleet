const mongoose = require('mongoose');

// Passenger Schema
const passengerSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  firstName: String,
  lastName: String,
  fullName: String,
  profilePhoto: String,
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  homeAddress: {
    latitude: Number,
    longitude: Number,
    address: String,
    label: String
  },
  workAddress: {
    latitude: Number,
    longitude: Number,
    address: String,
    label: String
  },
  savedPlaces: [
    {
      label: String,
      latitude: Number,
      longitude: Number,
      address: String
    }
  ],
  ridePreferences: {
    carType: String,
    musicPreference: Boolean,
    talkativeLevel: { type: String, enum: ['quiet', 'normal', 'chat'] },
    shareRidePreference: Boolean,
    carSharingEnabled: Boolean
  },
  emergencyContacts: [
    {
      name: String,
      phoneNumber: String,
      relationship: String
    }
  ],
  totalRides: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive', 'suspended', 'verified'], default: 'active' },
  isVerified: { type: Boolean, default: false },
  verificationMethod: { type: String, enum: ['phone', 'email'] },
  verifiedAt: Date,
  lastRideDate: Date,
  accountCreatedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ride Request Schema
const rideRequestSchema = new mongoose.Schema({
  rideId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  passengerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Passenger',
    required: true,
    index: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  pickupLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: String,
    label: String
  },
  dropoffLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: String,
    label: String
  },
  scheduledTime: Date,
  rideType: {
    type: String,
    enum: ['economy', 'premium', 'xl', 'share', 'bike'],
    default: 'economy'
  },
  status: {
    type: String,
    enum: ['searching', 'matched', 'arrived', 'in_progress', 'completed', 'cancelled'],
    default: 'searching',
    index: true
  },
  estimatedFare: Number,
  finalFare: Number,
  rideStartTime: Date,
  rideEndTime: Date,
  distance: Number,
  duration: Number,
  route: [
    {
      latitude: Number,
      longitude: Number,
      timestamp: Date
    }
  ],
  paymentMethod: { type: String, enum: ['cash', 'card', 'wallet', 'upi'], default: 'card' },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transactionId: String,
  specialRequests: String,
  stops: [
    {
      latitude: Number,
      longitude: Number,
      address: String,
      arrivedAt: Date,
      departedAt: Date
    }
  ],
  promoCode: String,
  promoDiscount: { type: Number, default: 0 },
  tolls: { type: Number, default: 0 },
  taxes: { type: Number, default: 0 },
  finalPaymentBreakdown: {
    baseFare: Number,
    distanceFare: Number,
    timeFare: Number,
    surgePricing: Number,
    discount: Number,
    taxes: Number,
    tolls: Number,
    total: Number
  },
  feedback: {
    passengerRating: { type: Number, min: 1, max: 5 },
    driverRating: { type: Number, min: 1, max: 5 },
    passengerComment: String,
    driverComment: String,
    categories: {
      cleanliness: Number,
      communication: Number,
      driving: Number,
      comfort: Number
    }
  },
  cancellationReason: String,
  cancelledBy: { type: String, enum: ['passenger', 'driver', 'system'] },
  cancelledAt: Date,
  cancellationFee: Number,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  completedAt: Date
}, { timestamps: true });

// Rating & Review Schema
const ratingSchema = new mongoose.Schema({
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RideRequest'
  },
  raterId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  ratedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  raterType: { type: String, enum: ['passenger', 'driver'], required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  categories: {
    cleanliness: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    driving: { type: Number, min: 1, max: 5 },
    comfort: { type: Number, min: 1, max: 5 }
  },
  review: String,
  tags: [String],
  isAnonymous: { type: Boolean, default: false },
  isVisible: { type: Boolean, default: true },
  reportedAs: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Loyalty Program Schema
const loyaltyProgramSchema = new mongoose.Schema({
  passengerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Passenger',
    required: true,
    unique: true
  },
  points: { type: Number, default: 0, min: 0 },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  totalPointsEarned: { type: Number, default: 0 },
  pointsHistory: [
    {
      points: Number,
      reason: String,
      rideId: mongoose.Schema.Types.ObjectId,
      date: { type: Date, default: Date.now }
    }
  ],
  rewardsRedeemed: [
    {
      rewardId: mongoose.Schema.Types.ObjectId,
      pointsUsed: Number,
      rewardName: String,
      date: { type: Date, default: Date.now }
    }
  ],
  currentBenefits: [
    {
      benefit: String,
      value: String,
      expiresAt: Date
    }
  ],
  nextTierProgress: { type: Number, default: 0, min: 0, max: 100 },
  tierUpgradedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes
passengerSchema.index({ phoneNumber: 1 });
passengerSchema.index({ status: 1 });
passengerSchema.index({ createdAt: -1 });
rideRequestSchema.index({ passengerId: 1, createdAt: -1 });
rideRequestSchema.index({ driverId: 1, status: 1 });
rideRequestSchema.index({ status: 1, createdAt: -1 });
ratingSchema.index({ rideId: 1 });
ratingSchema.index({ ratedUserId: 1, raterType: 1 });
loyaltyProgramSchema.index({ tier: 1 });

module.exports = {
  Passenger: mongoose.model('Passenger', passengerSchema),
  RideRequest: mongoose.model('RideRequest', rideRequestSchema),
  Rating: mongoose.model('Rating', ratingSchema),
  LoyaltyProgram: mongoose.model('LoyaltyProgram', loyaltyProgramSchema)
};
