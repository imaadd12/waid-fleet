const mongoose = require("mongoose");

// Surge Pricing Schema
const surgePricingSchema = new mongoose.Schema(
  {
    zone: String, // Geographic zone/area
    basePricePerKm: {
      type: Number,
      default: 10,
    },
    surgeMultiplier: {
      type: Number,
      default: 1.0, // 1.0 = base price, 1.5 = 50% surge, 2.0 = 100% surge
      min: 1.0,
      max: 3.0,
    },
    demandLevel: {
      type: String,
      enum: ["low", "normal", "high", "critical"],
      default: "normal",
    },
    activeDrivers: {
      type: Number,
      default: 0,
    },
    requestsInQueue: {
      type: Number,
      default: 0,
    },
    estimatedWaitTime: Number, // in minutes
    reason: String, // e.g., "Peak hours", "Weather", "Major event"
    activeSince: Date,
    validUntil: Date,
  },
  { timestamps: true }
);

surgePricingSchema.index({ zone: 1, validUntil: 1 });

// Referral System Schema
const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referrerType: {
      type: String,
      enum: ["driver", "passenger"],
      required: true,
    },
    referralCode: {
      type: String,
      required: true,
      index: true,
    },
    referralLink: String,
    bonusAmount: {
      type: Number,
      default: 0,
    },
    successfulReferrals: [
      {
        referee: mongoose.Schema.Types.ObjectId,
        refereeType: String,
        referralDate: Date,
        completedFirstRide: {
          type: Boolean,
          default: false,
        },
        firstRideDate: Date,
        bonusUnlocked: {
          type: Boolean,
          default: false,
        },
      },
    ],
    totalEarnings: {
      type: Number,
      default: 0,
    },
    totalReferrals: {
      type: Number,
      default: 0,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: Date,
    status: {
      type: String,
      enum: ["active", "expired", "suspended"],
      default: "active",
    },
  },
  { timestamps: true }
);

referralSchema.index({ referrer: 1, referrerType: 1 });

// Gamification/Achievement Schema
const achievementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userType: {
      type: String,
      enum: ["driver", "passenger"],
      required: true,
    },
    achievements: [
      {
        achievementId: {
          type: String,
          enum: [
            "first_ride",
            "hundred_rides",
            "thousand_rides",
            "perfect_rating",
            "safety_star",
            "top_rated_driver",
            "friendly_passenger",
            "early_bird",
            "night_owl",
            "eco_driver",
            "referral_master",
            "loyalty_program_elite",
          ],
        },
        name: String,
        description: String,
        icon: String,
        unlockedAt: Date,
        points: Number,
      },
    ],
    badges: [
      {
        badgeId: String,
        name: String, // e.g., "Safety Star", "Top Driver", "Eco Warrior"
        level: { type: String, enum: ["bronze", "silver", "gold", "platinum"] },
        earnedAt: Date,
        expiresAt: Date,
      },
    ],
    totalPoints: {
      type: Number,
      default: 0,
    },
    currentLevel: {
      type: String,
      enum: ["rookie", "regular", "elite", "legend"],
      default: "rookie",
    },
    levelProgress: {
      type: Number,
      default: 0,
    }, // percentage
    leaderboardRank: Number,
    totalAchievements: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

achievementSchema.index({ user: 1, userType: 1 });
achievementSchema.index({ "badges.expiresAt": 1 });

// Leaderboard Schema (denormalized for performance)
const leaderboardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    userType: {
      type: String,
      enum: ["driver", "passenger"],
    },
    name: String,
    rating: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    ridesCompleted: {
      type: Number,
      default: 0,
    },
    weeklyRank: Number,
    monthlyRank: Number,
    allTimeRank: Number,
    period: {
      type: String,
      enum: ["weekly", "monthly", "all_time"],
    },
    category: {
      type: String,
      enum: ["top_rated", "most_rides", "highest_earnings", "safest"],
    },
  },
  { timestamps: true }
);

leaderboardSchema.index({ period: 1, category: 1, score: -1 });
leaderboardSchema.index({ user: 1, userType: 1 });

module.exports = {
  SurgePricing: mongoose.model("SurgePricing", surgePricingSchema),
  Referral: mongoose.model("Referral", referralSchema),
  Achievement: mongoose.model("Achievement", achievementSchema),
  Leaderboard: mongoose.model("Leaderboard", leaderboardSchema),
};
