const express = require("express");
const router = express.Router();
const {
  getSurgePrice,
  createSurgePricing,
  getActiveSurgePricing,
  generateReferralCode,
  applyReferralCode,
  getReferralStats,
  unlockAchievement,
  getLeaderboard,
  getUserAchievements,
} = require("../controllers/gamificationController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// ============ SURGE PRICING ROUTES ============

// @route   GET /api/surge/zone/:zone
// @desc    Get current surge pricing for a zone
// @access  Public
router.get("/zone/:zone", getSurgePrice);

// @route   GET /api/surge/active
// @desc    Get all active surge pricing
// @access  Public
router.get("/active", getActiveSurgePricing);

// @route   POST /api/surge/create
// @desc    Create/Update surge pricing (Admin only)
// @access  Private (Admin only)
router.post("/create", protect, adminOnly, createSurgePricing);

// ============ REFERRAL ROUTES ============

// @route   POST /api/referral/generate
// @desc    Generate referral code
// @access  Private
router.post("/generate", protect, generateReferralCode);

// @route   POST /api/referral/apply
// @desc    Apply referral code during signup
// @access  Public
router.post("/apply", applyReferralCode);

// @route   GET /api/referral/stats
// @desc    Get referral statistics
// @access  Private
router.get("/stats", protect, getReferralStats);

// ============ GAMIFICATION/ACHIEVEMENTS ROUTES ============

// @route   POST /api/gamification/unlock-achievement
// @desc    Unlock an achievement
// @access  Private (Admin only - for automated trigger)
router.post("/unlock-achievement", protect, adminOnly, unlockAchievement);

// @route   GET /api/gamification/leaderboard
// @desc    Get leaderboard
// @access  Public
router.get("/leaderboard", getLeaderboard);

// @route   GET /api/gamification/my-achievements
// @desc    Get user's achievements
// @access  Private
router.get("/my-achievements", protect, getUserAchievements);

module.exports = router;
