const { SurgePricing, Referral, Achievement, Leaderboard } = require("../models/gamificationModel");
const User = require("../models/userModel");
const logger = require("../config/logger");

// ============ SURGE PRICING CONTROLLER ============

/**
 * Get current surge pricing for a zone
 * GET /api/surge/zone/:zone
 */
exports.getSurgePrice = async (req, res, next) => {
  try {
    const { zone } = req.params;
    
    const surgePricing = await SurgePricing.findOne({
      zone,
      validUntil: { $gt: new Date() },
    });

    if (!surgePricing) {
      return res.status(200).json({
        success: true,
        status: 200,
        message: "No active surge pricing",
        data: {
          zone,
          surgeMultiplier: 1.0,
          demandLevel: "normal",
          basePrice: 10,
        },
      });
    }

    res.status(200).json({
      success: true,
      status: 200,
      message: "Surge pricing retrieved",
      data: surgePricing,
    });
  } catch (error) {
    logger.error("Error getting surge price:", { error: error.message });
    res.status(500).json({
      success: false,
      status: 500,
      message: "Failed to retrieve surge pricing",
    });
  }
};

/**
 * Create/Update surge pricing for a zone (Admin only)
 * POST /api/surge/create
 */
exports.createSurgePricing = async (req, res, next) => {
  try {
    const { zone, surgeMultiplier, demandLevel, reason, validUntil } = req.body;

    let surgePricing = await SurgePricing.findOne({ zone });

    if (surgePricing) {
      surgePricing.surgeMultiplier = surgeMultiplier;
      surgePricing.demandLevel = demandLevel;
      surgePricing.reason = reason;
      surgePricing.validUntil = validUntil;
      surgePricing.activeSince = new Date();
    } else {
      surgePricing = new SurgePricing({
        zone,
        surgeMultiplier,
        demandLevel,
        reason,
        validUntil,
        activeSince: new Date(),
      });
    }

    await surgePricing.save();

    logger.info(`Surge pricing updated for zone: ${zone}`, {
      multiplier: surgeMultiplier,
    });

    res.status(201).json({
      success: true,
      status: 201,
      message: "Surge pricing created/updated",
      data: surgePricing,
    });
  } catch (error) {
    logger.error("Error creating surge pricing:", { error: error.message });
    res.status(500).json({
      success: false,
      status: 500,
      message: "Failed to create surge pricing",
    });
  }
};

/**
 * Get all active surge pricing
 * GET /api/surge/active
 */
exports.getActiveSurgePricing = async (req, res, next) => {
  try {
    const surges = await SurgePricing.find({
      validUntil: { $gt: new Date() },
    }).sort({ surgeMultiplier: -1 });

    res.status(200).json({
      success: true,
      status: 200,
      message: "Active surge pricing retrieved",
      data: surges,
    });
  } catch (error) {
    logger.error("Error getting active surge pricing:", { error: error.message });
    res.status(500).json({
      success: false,
      status: 500,
      message: "Failed to retrieve active surge pricing",
    });
  }
};

// ============ REFERRAL CONTROLLER ============

/**
 * Generate referral code
 * POST /api/referral/generate
 */
exports.generateReferralCode = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role;

    // Check if user already has active referral
    let referral = await Referral.findOne({
      referrer: userId,
      status: "active",
    });

    if (referral) {
      return res.status(200).json({
        success: true,
        status: 200,
        message: "Existing referral code retrieved",
        data: referral,
      });
    }

    // Generate unique referral code
    const referralCode = `REF_${userId.toString().slice(-6).toUpperCase()}_${Date.now()}`;
    const referralLink = `${process.env.APP_URL}/register?ref=${referralCode}`;

    referral = new Referral({
      referrer: userId,
      referrerType: userType,
      referralCode,
      referralLink,
      bonusAmount: userType === "driver" ? 500 : 100, // Different bonus for drivers
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    });

    await referral.save();

    logger.info(`Referral code generated for user: ${userId}`, {
      code: referralCode,
    });

    res.status(201).json({
      success: true,
      status: 201,
      message: "Referral code generated",
      data: referral,
    });
  } catch (error) {
    logger.error("Error generating referral code:", { error: error.message });
    res.status(500).json({
      success: false,
      status: 500,
      message: "Failed to generate referral code",
    });
  }
};

/**
 * Apply referral code during signup
 * POST /api/referral/apply
 */
exports.applyReferralCode = async (req, res, next) => {
  try {
    const { referralCode, newUserId } = req.body;

    const referral = await Referral.findOne({ referralCode, status: "active" });

    if (!referral) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Invalid referral code",
      });
    }

    // Add new referral to list
    referral.successfulReferrals.push({
      referee: newUserId,
      referralDate: new Date(),
    });

    referral.totalReferrals += 1;
    await referral.save();

    // Add bonus to referrer wallet (implement with your payment system)
    logger.info(`Referral applied: ${referralCode}`, { newUser: newUserId });

    res.status(200).json({
      success: true,
      status: 200,
      message: "Referral code applied successfully",
      data: referral,
    });
  } catch (error) {
    logger.error("Error applying referral code:", { error: error.message });
    res.status(500).json({
      success: false,
      status: 500,
      message: "Failed to apply referral code",
    });
  }
};

/**
 * Get referral stats
 * GET /api/referral/stats
 */
exports.getReferralStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const referral = await Referral.findOne({ referrer: userId });

    if (!referral) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "No referral found",
      });
    }

    res.status(200).json({
      success: true,
      status: 200,
      message: "Referral stats retrieved",
      data: {
        totalReferrals: referral.totalReferrals,
        totalEarnings: referral.totalEarnings,
        successfulReferrals: referral.successfulReferrals.filter(
          (ref) => ref.completedFirstRide
        ).length,
        bonusAmount: referral.bonusAmount,
        referralCode: referral.referralCode,
        referralLink: referral.referralLink,
      },
    });
  } catch (error) {
    logger.error("Error getting referral stats:", { error: error.message });
    res.status(500).json({
      success: false,
      status: 500,
      message: "Failed to retrieve referral stats",
    });
  }
};

// ============ GAMIFICATION CONTROLLER ============

/**
 * Unlock achievement
 * POST /api/gamification/unlock-achievement
 */
exports.unlockAchievement = async (req, res, next) => {
  try {
    const { userId, achievementId, userType } = req.body;

    let achievement = await Achievement.findOne({
      user: userId,
      userType,
    });

    if (!achievement) {
      achievement = new Achievement({
        user: userId,
        userType,
        achievements: [],
        badges: [],
      });
    }

    // Check if already unlocked
    const exists = achievement.achievements.some(
      (a) => a.achievementId === achievementId
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Achievement already unlocked",
      });
    }

    // Define achievements
    const achievementData = {
      first_ride: {
        name: "First Ride",
        description: "Complete your first ride",
        points: 10,
      },
      hundred_rides: {
        name: "Hundred Rides",
        description: "Complete 100 rides",
        points: 100,
      },
      perfect_rating: {
        name: "Perfect Rating",
        description: "Maintain 5-star rating for 20 rides",
        points: 50,
      },
      safety_star: {
        name: "Safety Star",
        description: "Complete 50 rides with no incidents",
        points: 75,
      },
    };

    const newAchievement = {
      achievementId,
      name: achievementData[achievementId]?.name,
      description: achievementData[achievementId]?.description,
      points: achievementData[achievementId]?.points,
      unlockedAt: new Date(),
    };

    achievement.achievements.push(newAchievement);
    achievement.totalPoints += newAchievement.points;
    achievement.totalAchievements += 1;

    await achievement.save();

    logger.info(`Achievement unlocked: ${achievementId} for user: ${userId}`);

    res.status(201).json({
      success: true,
      status: 201,
      message: "Achievement unlocked",
      data: achievement,
    });
  } catch (error) {
    logger.error("Error unlocking achievement:", { error: error.message });
    res.status(500).json({
      success: false,
      status: 500,
      message: "Failed to unlock achievement",
    });
  }
};

/**
 * Get leaderboard
 * GET /api/gamification/leaderboard
 */
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { period = "weekly", category = "top_rated", limit = 10 } = req.query;

    const leaderboard = await Leaderboard.find({ period, category })
      .sort({ score: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      status: 200,
      message: "Leaderboard retrieved",
      data: leaderboard,
    });
  } catch (error) {
    logger.error("Error getting leaderboard:", { error: error.message });
    res.status(500).json({
      success: false,
      status: 500,
      message: "Failed to retrieve leaderboard",
    });
  }
};

/**
 * Get user achievements
 * GET /api/gamification/my-achievements
 */
exports.getUserAchievements = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role;

    const achievement = await Achievement.findOne({
      user: userId,
      userType,
    });

    if (!achievement) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "No achievements found",
      });
    }

    res.status(200).json({
      success: true,
      status: 200,
      message: "User achievements retrieved",
      data: achievement,
    });
  } catch (error) {
    logger.error("Error getting user achievements:", { error: error.message });
    res.status(500).json({
      success: false,
      status: 500,
      message: "Failed to retrieve achievements",
    });
  }
};
