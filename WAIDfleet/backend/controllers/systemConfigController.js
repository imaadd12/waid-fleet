const SystemConfig = require("../models/systemConfigModel");
const AuditLog = require("../models/auditLogModel");
const asyncHandler = require("express-async-handler");

/**
 * @desc    Get system configuration
 * @route   GET /api/admin/config
 */
exports.getConfig = asyncHandler(async (req, res) => {
  let config = await SystemConfig.findOne({ key: "global_settings" });
  if (!config) {
    config = await SystemConfig.create({ key: "global_settings" });
  }
  res.json({ success: true, data: config });
});

/**
 * @desc    Update system configuration
 * @route   PUT /api/admin/config
 */
exports.updateConfig = asyncHandler(async (req, res) => {
  let config = await SystemConfig.findOne({ key: "global_settings" });
  if (!config) {
    config = await SystemConfig.create({ key: "global_settings" });
  }

  // Only Super Admin can update
  if (req.user.role !== "super_admin" && req.user.role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Only Super Admin can update platform settings" });
  }

  const { 
    adminAbsent, defaultWeeklyRent, lateFeePercentage, accidentPushAlerts,
    baseFare, perKmRate, surgeMultiplier, driverCommissionPercentage,
    currency, timezone, language, notificationToggles
  } = req.body;

  // Track changes for Audit Log
  const changes = {
    before: { ...config.toObject() },
    after: {}
  };

  if (adminAbsent !== undefined) config.adminAbsent = adminAbsent;
  if (defaultWeeklyRent !== undefined) config.defaultWeeklyRent = defaultWeeklyRent;
  if (lateFeePercentage !== undefined) config.lateFeePercentage = lateFeePercentage;
  if (accidentPushAlerts !== undefined) config.accidentPushAlerts = accidentPushAlerts;
  
  // Pricing
  if (baseFare !== undefined) config.baseFare = baseFare;
  if (perKmRate !== undefined) config.perKmRate = perKmRate;
  if (surgeMultiplier !== undefined) config.surgeMultiplier = surgeMultiplier;
  if (driverCommissionPercentage !== undefined) config.driverCommissionPercentage = driverCommissionPercentage;

  // Localization
  if (currency !== undefined) config.currency = currency;
  if (timezone !== undefined) config.timezone = timezone;
  if (language !== undefined) config.language = language;

  // Notifications
  if (notificationToggles !== undefined) {
    config.notificationToggles = { ...config.notificationToggles, ...notificationToggles };
  }
  
  config.updatedBy = req.user._id;
  await config.save();
  changes.after = { ...config.toObject() };

  // 📝 Create Audit Log
  await AuditLog.create({
    actionType: 'update',
    entityType: 'Settings',
    entityName: 'Global Settings',
    performedBy: req.user._id,
    performedByName: req.user.name,
    performedByRole: req.user.role,
    module: 'settings',
    changes: changes,
    description: `Platform settings updated by ${req.user.name}`
  });

  res.json({ success: true, message: "System configuration updated", data: config });
});
