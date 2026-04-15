const asyncHandler = require('express-async-handler');
const { Wallet, Transaction, PaymentMethod, SubscriptionPlan, DriverSubscription, AutomatedPayout } = require('../models/paymentModel');
const { generateUniqueId } = require('../utils/helpers');

// ===== WALLET OPERATIONS =====

// @desc    Get wallet balance
// @route   GET /api/wallet/balance/:driverId
// @access  Private
const getWalletBalance = asyncHandler(async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ driverId: req.params.driverId });
    
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    res.status(200).json({
      success: true,
      data: wallet
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Recharge wallet
// @route   POST /api/wallet/recharge
// @access  Private
const rechargeWallet = asyncHandler(async (req, res) => {
  const { driverId, amount, paymentMethodId } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  try {
    // Get wallet
    let wallet = await Wallet.findOne({ driverId });
    if (!wallet) {
      wallet = await Wallet.create({ driverId });
    }

    // Create transaction
    const transactionId = generateUniqueId('TXN');
    const transaction = await Transaction.create({
      transactionId,
      driverId,
      type: 'credit',
      category: 'wallet_recharge',
      amount,
      status: 'completed',
      paymentMethod: paymentMethodId,
      description: 'Wallet Recharge',
      netAmount: amount,
      walletBalanceBefore: wallet.balance,
      walletBalanceAfter: wallet.balance + amount
    });

    // Update wallet
    wallet.balance += amount;
    wallet.totalEarned += amount;
    wallet.lastTransactionDate = new Date();
    await wallet.save();

    res.status(200).json({
      success: true,
      data: { transaction, wallet },
      message: 'Wallet recharged successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get wallet transactions
// @route   GET /api/wallet/transactions/:driverId
// @access  Private
const getWalletTransactions = asyncHandler(async (req, res) => {
  try {
    const { limit = 50, skip = 0, type, status } = req.query;
    let filter = { driverId: req.params.driverId };

    if (type) filter.type = type;
    if (status) filter.status = status;

    const transactions = await Transaction.find(filter)
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('paymentMethod');

    const total = await Transaction.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: transactions,
      total,
      count: transactions.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Withdraw from wallet
// @route   POST /api/wallet/withdraw
// @access  Private
const withdrawFromWallet = asyncHandler(async (req, res) => {
  const { driverId, amount, paymentMethodId } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  try {
    const wallet = await Wallet.findOne({ driverId });
    
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    if (wallet.walletLocking.isLocked) {
      return res.status(400).json({ message: 'Wallet is locked' });
    }

    // Create transaction
    const transactionId = generateUniqueId('WD');
    const transaction = await Transaction.create({
      transactionId,
      driverId,
      type: 'debit',
      category: 'withdrawal',
      amount,
      status: 'pending',
      paymentMethod: paymentMethodId,
      description: 'Withdrawal Request',
      netAmount: amount,
      walletBalanceBefore: wallet.balance,
      walletBalanceAfter: wallet.balance - amount
    });

    // Update wallet
    wallet.balance -= amount;
    wallet.totalWithdrawn += amount;
    wallet.lastTransactionDate = new Date();
    await wallet.save();

    res.status(200).json({
      success: true,
      data: { transaction, wallet },
      message: 'Withdrawal initiated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== SUBSCRIPTION OPERATIONS =====

// @desc    Get subscription plans
// @route   GET /api/subscriptions/plans
// @access  Public
const getSubscriptionPlans = asyncHandler(async (req, res) => {
  try {
    const { type, isActive = true } = req.query;
    let filter = { isActive };

    if (type) filter.type = type;

    const plans = await SubscriptionPlan.find(filter);

    res.status(200).json({
      success: true,
      data: plans,
      count: plans.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Subscribe to plan
// @route   POST /api/subscriptions/subscribe
// @access  Private
const subscribeToPlan = asyncHandler(async (req, res) => {
  const { driverId, planId, billingCycle = 'monthly' } = req.body;

  try {
    // Check if plan exists
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Check if already subscribed
    let subscription = await DriverSubscription.findOne({ driverId });
    
    if (subscription) {
      return res.status(400).json({ message: 'Driver already has an active subscription' });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (billingCycle === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create subscription
    subscription = await DriverSubscription.create({
      driverId,
      planId,
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
      billingCycle,
      status: 'active',
      lastPaymentDate: startDate,
      nextPaymentDate: endDate
    });

    // Create payment transaction
    const fee = billingCycle === 'monthly' ? plan.monthlyFee : plan.annualFee;
    const transactionId = generateUniqueId('SUB');

    await Transaction.create({
      transactionId,
      driverId,
      type: 'debit',
      category: 'subscription',
      amount: fee,
      status: 'completed',
      description: `${plan.planName} Subscription (${billingCycle})`,
      netAmount: fee,
      relatedEntity: 'subscription'
    });

    res.status(201).json({
      success: true,
      data: subscription,
      message: 'Subscription activated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get driver subscription
// @route   GET /api/subscriptions/driver/:driverId
// @access  Private
const getDriverSubscription = asyncHandler(async (req, res) => {
  try {
    const subscription = await DriverSubscription.findOne({ driverId: req.params.driverId })
      .populate('planId');

    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription' });
    }

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Cancel subscription
// @route   PUT /api/subscriptions/:subscriptionId/cancel
// @access  Private
const cancelSubscription = asyncHandler(async (req, res) => {
  const { cancellationReason } = req.body;

  try {
    const subscription = await DriverSubscription.findByIdAndUpdate(
      req.params.subscriptionId,
      {
        status: 'cancelled',
        cancellationReason,
        cancelledDate: new Date()
      },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.status(200).json({
      success: true,
      data: subscription,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== PAYMENT METHOD OPERATIONS =====

// @desc    Add payment method
// @route   POST /api/payment-methods
// @access  Private
const addPaymentMethod = asyncHandler(async (req, res) => {
  const { driverId, type, provider, providerPaymentMethodId, cardDetails, bankDetails, upiDetails } = req.body;

  try {
    // If marking as default, unmark others
    if (req.body.isDefault) {
      await PaymentMethod.updateMany({ driverId }, { isDefault: false });
    }

    const paymentMethod = await PaymentMethod.create({
      driverId,
      type,
      provider,
      providerPaymentMethodId,
      cardDetails,
      bankDetails,
      upiDetails,
      isDefault: req.body.isDefault || true
    });

    res.status(201).json({
      success: true,
      data: paymentMethod,
      message: 'Payment method added successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get payment methods
// @route   GET /api/payment-methods/:driverId
// @access  Private
const getPaymentMethods = asyncHandler(async (req, res) => {
  try {
    const methods = await PaymentMethod.find({ driverId: req.params.driverId, isActive: true });

    res.status(200).json({
      success: true,
      data: methods,
      count: methods.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete payment method
// @route   DELETE /api/payment-methods/:id
// @access  Private
const deletePaymentMethod = asyncHandler(async (req, res) => {
  try {
    const method = await PaymentMethod.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!method) {
      return res.status(404).json({ message: 'Payment method not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== PAYOUT OPERATIONS =====

// @desc    Schedule automated payout
// @route   POST /api/payouts/schedule
// @access  Private (Admin only)
const scheduleAutomatedPayout = asyncHandler(async (req, res) => {
  const { frequency, payoutDate } = req.body;

  try {
    const batchId = generateUniqueId('PAYOUT');
    
    const payout = await AutomatedPayout.create({
      payoutBatchId: batchId,
      frequency,
      payoutDate,
      status: 'scheduled',
      nextPayoutDate: payoutDate
    });

    res.status(201).json({
      success: true,
      data: payout,
      message: 'Payout scheduled successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get payouts
// @route   GET /api/payouts
// @access  Private (Admin only)
const getPayouts = asyncHandler(async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;
    let filter = {};

    if (status) filter.status = status;

    const payouts = await AutomatedPayout.find(filter)
      .sort('-payoutDate')
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await AutomatedPayout.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: payouts,
      total,
      count: payouts.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Process payout
// @route   POST /api/payouts/:batchId/process
// @access  Private (Admin only)
const processPayout = asyncHandler(async (req, res) => {
  try {
    const payout = await AutomatedPayout.findOne({ payoutBatchId: req.params.batchId });

    if (!payout) {
      return res.status(404).json({ message: 'Payout batch not found' });
    }

    payout.status = 'processing';
    await payout.save();

    // Simulate payout processing (in real implementation, call payment gateway)
    setTimeout(async () => {
      payout.status = 'completed';
      payout.processedAt = new Date();
      await payout.save();
    }, 2000);

    res.status(200).json({
      success: true,
      data: payout,
      message: 'Payout processing started'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = {
  getWalletBalance,
  rechargeWallet,
  getWalletTransactions,
  withdrawFromWallet,
  getSubscriptionPlans,
  subscribeToPlan,
  getDriverSubscription,
  cancelSubscription,
  addPaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
  scheduleAutomatedPayout,
  getPayouts,
  processPayout
};
