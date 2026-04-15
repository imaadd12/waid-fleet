const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      unique: true,
    },
    
    // ==================== CORE METRICS ====================
    totalTrips: { type: Number, default: 0 },
    completedTrips: { type: Number, default: 0 },
    cancelledTrips: { type: Number, default: 0 },
    noShowTrips: { type: Number, default: 0 },
    
    // ==================== RATINGS & REVIEWS ====================
    totalRating: { type: Number, default: 0, min: 0 },
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    // Rating breakdown
    fiveStarCount: { type: Number, default: 0 },
    fourStarCount: { type: Number, default: 0 },
    threeStarCount: { type: Number, default: 0 },
    twoStarCount: { type: Number, default: 0 },
    oneStarCount: { type: Number, default: 0 },
    
    // ==================== OPERATIONAL RATES ====================
    acceptanceRate: { type: Number, default: 100, min: 0, max: 100 },
    cancellationRate: { type: Number, default: 0, min: 0, max: 100 },
    onTimeDeliveryRate: { type: Number, default: 100, min: 0, max: 100 },
    completionRate: { type: Number, default: 100, min: 0, max: 100 },
    noShowRate: { type: Number, default: 0, min: 0, max: 100 },
    
    // ==================== EARNINGS ====================
    totalEarnings: { type: Number, default: 0 },
    monthlyEarnings: { type: Number, default: 0 },
    weeklyEarnings: { type: Number, default: 0 },
    dailyEarnings: { type: Number, default: 0 },
    avgEarningsPerTrip: { type: Number, default: 0 },
    avgEarningsPerHour: { type: Number, default: 0 },
    // Earnings breakdown
    baseEarnings: { type: Number, default: 0 },
    bonusEarnings: { type: Number, default: 0 },
    incentiveEarnings: { type: Number, default: 0 },
    
    // ==================== OPERATIONAL METRICS ====================
    totalDistance: { type: Number, default: 0 }, // in km
    totalHours: { type: Number, default: 0 },
    avgTripDuration: { type: Number, default: 0 }, // in minutes
    avgTripDistance: { type: Number, default: 0 }, // in km
    avgSpeed: { type: Number, default: 0 }, // km/h
    idleTime: { type: Number, default: 0 }, // hours
    tripsPerDay: { type: Number, default: 0 },
    
    // ==================== SAFETY & COMPLIANCE ====================
    safetyScore: { type: Number, default: 100, min: 0, max: 100 },
    violations: { type: Number, default: 0 },
    speedingViolations: { type: Number, default: 0 },
    incidents: { type: Number, default: 0 },
    hardBrakingCount: { type: Number, default: 0 },
    accidentCount: { type: Number, default: 0 },
    
    // ==================== TIER & ACHIEVEMENTS ====================
    level: { 
      type: String, 
      enum: ["bronze", "silver", "gold", "platinum"], 
      default: "bronze" 
    },
    badges: [{
      name: String,
      description: String,
      dateEarned: { type: Date, default: Date.now },
      icon: String
    }],
    streak: { type: Number, default: 0 }, // consecutive perfect days
    bestStreak: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 }, // gamification points
    
    // ==================== GOALS & TARGETS ====================
    goals: [{
      type: String,
      targetValue: Number,
      currentValue: Number,
      deadline: Date,
      completed: { type: Boolean, default: false },
      reward: Number,
      createdAt: { type: Date, default: Date.now }
    }],
    
    // ==================== ALERTS & WARNINGS ====================
    alerts: [{
      type: String,
      severity: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
      message: String,
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }],
    
    // ==================== WEEKLY/MONTHLY ANALYTICS ====================
    weeklyMetrics: [{
      week: Number,
      year: Number,
      trips: Number,
      earnings: Number,
      avgRating: Number,
      distance: Number,
      hours: Number
    }],
    monthlyMetrics: [{
      month: Number,
      year: Number,
      trips: Number,
      earnings: Number,
      avgRating: Number,
      distance: Number,
      hours: Number,
      incidents: Number
    }],
    
    // ==================== COMPARISONS & BENCHMARKING ====================
    teamAvgRating: { type: Number, default: 0 },
    teamAvgEarnings: { type: Number, default: 0 },
    competitorRank: { type: Number, default: 0 },
    percentileRating: { type: Number, default: 0 }, // 0-100
    percentileEarnings: { type: Number, default: 0 },
    
    // ==================== TIMESTAMPS ====================
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes for better query performance
performanceSchema.index({ safetyScore: 1, avgRating: 1 });
performanceSchema.index({ totalEarnings: -1 });
performanceSchema.index({ totalTrips: -1 });
performanceSchema.index({ level: 1 });

module.exports = mongoose.model("Performance", performanceSchema);
