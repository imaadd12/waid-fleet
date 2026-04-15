const express = require("express");
const {
  getAdminDashboard,
  getDashboardCharts,
  getAlerts
} = require("../controllers/adminDashboardController");
const {
  createAdminUser,
  getAllAdminUsers,
  getAdminUserById,
  updateAdminUser,
  changeAdminPassword,
  toggleAdminStatus,
  resetLoginAttempts,
  deleteAdminUser,
  getAdminActivityLog,
  createSubAdmin,
  getSubAdmins,
  updateSubAdminPermissions,
  deleteSubAdmin
} = require("../controllers/adminUserController");
const {
  createTicket,
  getAllTickets,
  getTicketById,
  assignTicket,
  addTicketMessage,
  resolveTicket,
  closeTicket,
  reopenTicket,
  addSatisfactionRating,
  getTicketStats
} = require("../controllers/supportTicketController");
const {
  getAllAuditLogs,
  getAuditLogById,
  getEntityAuditLogs,
  getUserActivityLogs,
  getAuditStats,
  exportAuditLogs,
  getCriticalActionsReport
} = require("../controllers/auditLogController");
const {
  createReport,
  getAllReports,
  getReportById,
  generateDailyReport,
  generateMonthlyReport,
  getReportSummary,
  shareReport,
  deleteReport
} = require("../controllers/reportController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// ==================== ADMIN DASHBOARD ====================
router.get("/dashboard", protect, adminOnly, getAdminDashboard);
router.get("/dashboard/charts", protect, adminOnly, getDashboardCharts);
router.get("/dashboard/alerts", protect, adminOnly, getAlerts);

// ==================== ADMIN USER MANAGEMENT ====================
router.post("/users", protect, adminOnly, createAdminUser);
router.get("/users", protect, adminOnly, getAllAdminUsers);
router.get("/users/:id", protect, adminOnly, getAdminUserById);
router.put("/users/:id", protect, adminOnly, updateAdminUser);
router.put("/users/:id/password", protect, changeAdminPassword);
router.put("/users/:id/toggle-status", protect, adminOnly, toggleAdminStatus);
router.put("/users/:id/reset-attempts", protect, adminOnly, resetLoginAttempts);
router.delete("/users/:id", protect, adminOnly, deleteAdminUser);
router.get("/users/:id/activity", protect, adminOnly, getAdminActivityLog);

// ==================== SUPPORT TICKETS ====================
router.post("/tickets", protect, createTicket);
router.get("/tickets", protect, getAllTickets);
router.get("/tickets/stats/summary", protect, adminOnly, getTicketStats);
router.get("/tickets/:ticketId", protect, getTicketById);
router.put("/tickets/:ticketId/assign", protect, adminOnly, assignTicket);
router.post("/tickets/:ticketId/message", protect, addTicketMessage);
router.put("/tickets/:ticketId/resolve", protect, adminOnly, resolveTicket);
router.put("/tickets/:ticketId/close", protect, adminOnly, closeTicket);
router.put("/tickets/:ticketId/reopen", protect, reopenTicket);
router.put("/tickets/:ticketId/satisfaction", protect, addSatisfactionRating);

// ==================== AUDIT LOGS ====================
router.get("/audit-logs", protect, adminOnly, getAllAuditLogs);
router.get("/audit-logs/stats/summary", protect, adminOnly, getAuditStats);
router.get("/audit-logs/:logId", protect, adminOnly, getAuditLogById);
router.get("/audit-logs/entity/:entityType/:entityId", protect, adminOnly, getEntityAuditLogs);
router.get("/audit-logs/user/:userId", protect, adminOnly, getUserActivityLogs);
router.get("/audit-logs/export", protect, adminOnly, exportAuditLogs);
router.get("/audit-logs/report/critical", protect, adminOnly, getCriticalActionsReport);

// ==================== REPORTS ====================
router.post("/reports", protect, adminOnly, createReport);
router.get("/reports", protect, adminOnly, getAllReports);
router.get("/reports/summary", protect, adminOnly, getReportSummary);
router.post("/reports/daily", protect, adminOnly, generateDailyReport);
router.post("/reports/monthly", protect, adminOnly, generateMonthlyReport);
router.get("/reports/:reportId", protect, adminOnly, getReportById);
router.put("/reports/:reportId/share", protect, adminOnly, shareReport);
router.delete("/reports/:reportId", protect, adminOnly, deleteReport);

// ==================== SUB-ADMIN MANAGEMENT ====================
router.post("/subadmins", protect, adminOnly, createSubAdmin);
router.get("/subadmins", protect, adminOnly, getSubAdmins);
router.put("/subadmins/:id/permissions", protect, adminOnly, updateSubAdminPermissions);
router.delete("/subadmins/:id", protect, adminOnly, deleteSubAdmin);

// ==================== SYSTEM CONFIGURATION ====================
const { getConfig, updateConfig } = require("../controllers/systemConfigController");
router.get("/config", protect, adminOnly, getConfig);
router.put("/config", protect, adminOnly, updateConfig);

module.exports = router;
