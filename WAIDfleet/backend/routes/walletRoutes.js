const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// Placeholder controller functions - to be implemented
const walletController = {
  getWalletBalance: (req, res) => res.json({ message: "Get wallet balance" }),
  rechargeWallet: (req, res) => res.json({ message: "Recharge wallet" }),
  withdraw: (req, res) => res.json({ message: "Withdraw from wallet" }),
  getTransactions: (req, res) => res.json({ message: "Get transactions" }),
  subscribeToPlan: (req, res) => res.json({ message: "Subscribe to plan" }),
  getSubscription: (req, res) => res.json({ message: "Get subscription" }),
  cancelSubscription: (req, res) => res.json({ message: "Cancel subscription" }),
};

// @route   GET /api/wallet/balance
// @desc    Get wallet balance
// @access  Private
router.get("/balance", protect, walletController.getWalletBalance);

// @route   POST /api/wallet/recharge
// @desc    Recharge wallet
// @access  Private
router.post("/recharge", protect, walletController.rechargeWallet);

// @route   POST /api/wallet/withdraw
// @desc    Withdraw from wallet
// @access  Private
router.post("/withdraw", protect, walletController.withdraw);

// @route   GET /api/wallet/transactions
// @desc    Get wallet transactions
// @access  Private
router.get("/transactions", protect, walletController.getTransactions);

// @route   POST /api/wallet/subscribe
// @desc    Subscribe to a plan
// @access  Private
router.post("/subscribe", protect, walletController.subscribeToPlan);

// @route   GET /api/wallet/subscription
// @desc    Get current subscription
// @access  Private
router.get("/subscription", protect, walletController.getSubscription);

// @route   POST /api/wallet/subscription/cancel
// @desc    Cancel subscription
// @access  Private
router.post("/subscription/cancel", protect, walletController.cancelSubscription);

module.exports = router;
