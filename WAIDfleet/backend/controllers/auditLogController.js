const AuditLog = require("../models/auditLogModel");
const asyncHandler = require("express-async-handler");

/**
 * @desc    Log an action (used internally)
 * @route   POST /api/admin/audit-logs (internal only)
 * @access  Internal
 */
exports.logAction = asyncHandler(async (req, res) => {
  const {
    actionType,
    entityType,
    entityId,
    entityName,
    changes,
    description,
    severity = "info"
  } = req.body;

  const auditLog = await AuditLog.create({
    actionType,
    entityType,
    entityId,
    entityName,
    performedBy: req.user?.id,
    performedByName: req.user?.name,
    performedByRole: req.user?.role,
    changes,
    description,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    severity,
    module: entityType.toLowerCase(),
    status: "success"
  });

  res.status(201).json({ success: true, data: auditLog });
});

/**
 * @desc    Get all audit logs
 * @route   GET /api/admin/audit-logs
 * @access  Private/Admin
 */
exports.getAllAuditLogs = asyncHandler(async (req, res) => {
  const { 
    actionType, 
    entityType, 
    performedBy, 
    severity, 
    startDate, 
    endDate, 
    sortBy = "createdAt", 
    page = 1, 
    limit = 50 
  } = req.query;

  const filter = {};

  if (actionType) filter.actionType = actionType;
  if (entityType) filter.entityType = entityType;
  if (performedBy) filter.performedBy = performedBy;
  if (severity) filter.severity = severity;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const total = await AuditLog.countDocuments(filter);
  const logs = await AuditLog.find(filter)
    .populate("performedBy", "name email role")
    .sort({ [sortBy]: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: logs,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
  });
});

/**
 * @desc    Get audit log by ID
 * @route   GET /api/admin/audit-logs/:logId
 * @access  Private/Admin
 */
exports.getAuditLogById = asyncHandler(async (req, res) => {
  const log = await AuditLog.findById(req.params.logId)
    .populate("performedBy", "name email role");

  if (!log) {
    return res.status(404).json({ success: false, message: "Audit log not found" });
  }

  res.json({ success: true, data: log });
});

/**
 * @desc    Get audit logs for specific entity
 * @route   GET /api/admin/audit-logs/entity/:entityType/:entityId
 * @access  Private/Admin
 */
exports.getEntityAuditLogs = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const total = await AuditLog.countDocuments({ entityType, entityId });
  const logs = await AuditLog.find({ entityType, entityId })
    .populate("performedBy", "name email role")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: logs,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
  });
});

/**
 * @desc    Get user activity logs
 * @route   GET /api/admin/audit-logs/user/:userId
 * @access  Private/Admin
 */
exports.getUserActivityLogs = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const total = await AuditLog.countDocuments({ performedBy: userId });
  const logs = await AuditLog.find({ performedBy: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: logs,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
  });
});

/**
 * @desc    Get audit log statistics
 * @route   GET /api/admin/audit-logs/stats/summary
 * @access  Private/Admin
 */
exports.getAuditStats = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = {
    totalActions: await AuditLog.countDocuments({ createdAt: { $gte: startDate } }),
    byActionType: await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$actionType", count: { $sum: 1 } } }
    ]),
    byEntityType: await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$entityType", count: { $sum: 1 } } }
    ]),
    bySeverity: await AuditLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$severity", count: { $sum: 1 } } }
    ]),
    criticalActions: await AuditLog.countDocuments({
      severity: "critical",
      createdAt: { $gte: startDate }
    }),
    failedActions: await AuditLog.countDocuments({
      status: "failure",
      createdAt: { $gte: startDate }
    })
  };

  res.json({ success: true, data: stats });
});

/**
 * @desc    Export audit logs
 * @route   GET /api/admin/audit-logs/export
 * @access  Private/Admin
 */
exports.exportAuditLogs = asyncHandler(async (req, res) => {
  const { startDate, endDate, format = "json" } = req.query;

  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const logs = await AuditLog.find(filter)
    .populate("performedBy", "name email role")
    .sort({ createdAt: -1 });

  if (format === "csv") {
    const csv = convertToCSV(logs);
    res.header("Content-Type", "text/csv");
    res.header("Content-Disposition", "attachment; filename=audit-logs.csv");
    res.send(csv);
  } else {
    res.json({ success: true, data: logs });
  }
});

/**
 * @desc    Get critical actions report
 * @route   GET /api/admin/audit-logs/report/critical
 * @access  Private/Admin
 */
exports.getCriticalActionsReport = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const criticalLogs = await AuditLog.find({
    severity: "critical",
    createdAt: { $gte: startDate }
  })
    .populate("performedBy", "name email role")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      period: `Last ${days} days`,
      totalCriticalActions: criticalLogs.length,
      logs: criticalLogs
    }
  });
});

/**
 * Helper function to convert logs to CSV
 */
function convertToCSV(logs) {
  const headers = ["Timestamp", "Action", "Entity", "Performed By", "Severity", "Status"];
  const rows = logs.map(log => [
    log.createdAt,
    log.actionType,
    `${log.entityType}:${log.entityId}`,
    log.performedByName,
    log.severity,
    log.status
  ]);

  const csv = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
  return csv;
}
