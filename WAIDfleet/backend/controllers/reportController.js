const Report = require("../models/reportModel");
const Driver = require("../models/driverModel");
const Vehicle = require("../models/vehicleModel");
const Trip = require("../models/tripModel");
const Billing = require("../models/billingModel");
const Performance = require("../models/performanceModel");
const asyncHandler = require("express-async-handler");

/**
 * @desc    Create report
 * @route   POST /api/admin/reports
 * @access  Private/Admin
 */
exports.createReport = asyncHandler(async (req, res) => {
  const { 
    reportName, 
    reportType, 
    reportCategory, 
    startDate, 
    endDate, 
    filters,
    format = "pdf"
  } = req.body;

  // Generate report data
  const reportData = await generateReportData(reportCategory, startDate, endDate, filters);

  const report = await Report.create({
    reportName,
    reportType,
    reportCategory,
    "reportDetails.startDate": startDate,
    "reportDetails.endDate": endDate,
    "reportDetails.format": format,
    "reportDetails.generatedBy": req.user.id,
    dataPoints: reportData.dataPoints,
    metrics: reportData.metrics,
    filters: filters || {},
    status: "generated",
    accessibleBy: [req.user.id]
  });

  res.status(201).json({
    success: true,
    message: "Report created successfully",
    data: report
  });
});

/**
 * @desc    Get all reports
 * @route   GET /api/admin/reports
 * @access  Private/Admin
 */
exports.getAllReports = asyncHandler(async (req, res) => {
  const { 
    reportType, 
    reportCategory, 
    status, 
    sortBy = "createdAt", 
    page = 1, 
    limit = 20 
  } = req.query;

  const filter = {};
  if (reportType) filter.reportType = reportType;
  if (reportCategory) filter.reportCategory = reportCategory;
  if (status) filter.status = status;
  // Filter by user's accessible reports
  filter.$or = [
    { "reportDetails.generatedBy": req.user.id },
    { accessibleBy: req.user.id }
  ];

  const total = await Report.countDocuments(filter);
  const reports = await Report.find(filter)
    .populate("reportDetails.generatedBy", "name email")
    .sort({ [sortBy]: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: reports,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
  });
});

/**
 * @desc    Get report by ID
 * @route   GET /api/admin/reports/:reportId
 * @access  Private/Admin
 */
exports.getReportById = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.reportId)
    .populate("reportDetails.generatedBy", "name email")
    .populate("accessibleBy", "name email");

  if (!report) {
    return res.status(404).json({ success: false, message: "Report not found" });
  }

  // Check access
  if (
    report.reportDetails.generatedBy._id.toString() !== req.user.id &&
    !report.accessibleBy.some(u => u._id.toString() === req.user.id)
  ) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  res.json({ success: true, data: report });
});

/**
 * @desc    Generate daily report
 * @route   POST /api/admin/reports/daily
 * @access  Private/Admin
 */
exports.generateDailyReport = asyncHandler(async (req, res) => {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const reportData = await generateReportData("operational", startDate, endDate);

  const report = await Report.create({
    reportName: `Daily Report - ${new Date().toDateString()}`,
    reportType: "daily",
    reportCategory: "operational",
    "reportDetails.startDate": startDate,
    "reportDetails.endDate": endDate,
    "reportDetails.generatedBy": req.user.id,
    dataPoints: reportData.dataPoints,
    metrics: reportData.metrics,
    status: "generated",
    accessibleBy: [req.user.id]
  });

  res.status(201).json({
    success: true,
    message: "Daily report generated",
    data: report
  });
});

/**
 * @desc    Generate monthly report
 * @route   POST /api/admin/reports/monthly
 * @access  Private/Admin
 */
exports.generateMonthlyReport = asyncHandler(async (req, res) => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const reportData = await generateReportData("financial", startDate, endDate);

  const report = await Report.create({
    reportName: `Monthly Report - ${now.toLocaleString("default", { month: "long", year: "numeric" })}`,
    reportType: "monthly",
    reportCategory: "financial",
    "reportDetails.startDate": startDate,
    "reportDetails.endDate": endDate,
    "reportDetails.generatedBy": req.user.id,
    dataPoints: reportData.dataPoints,
    metrics: reportData.metrics,
    status: "generated",
    accessibleBy: [req.user.id]
  });

  res.status(201).json({
    success: true,
    message: "Monthly report generated",
    data: report
  });
});

/**
 * @desc    Get report summary
 * @route   GET /api/admin/reports/summary
 * @access  Private/Admin
 */
exports.getReportSummary = asyncHandler(async (req, res) => {
  const summary = {
    totalReports: await Report.countDocuments({ "reportDetails.generatedBy": req.user.id }),
    reportsByType: await Report.aggregate([
      { $match: { "reportDetails.generatedBy": req.user.id } },
      { $group: { _id: "$reportType", count: { $sum: 1 } } }
    ]),
    reportsByCategory: await Report.aggregate([
      { $match: { "reportDetails.generatedBy": req.user.id } },
      { $group: { _id: "$reportCategory", count: { $sum: 1 } } }
    ]),
    recentReports: await Report.find({ "reportDetails.generatedBy": req.user.id })
      .limit(5)
      .sort({ createdAt: -1 })
  };

  res.json({ success: true, data: summary });
});

/**
 * @desc    Share report with users
 * @route   PUT /api/admin/reports/:reportId/share
 * @access  Private/Admin
 */
exports.shareReport = asyncHandler(async (req, res) => {
  const { userIds, accessLevel } = req.body;

  const report = await Report.findById(req.params.reportId);
  if (!report) {
    return res.status(404).json({ success: false, message: "Report not found" });
  }

  report.accessLevel = accessLevel || "team";
  report.accessibleBy = [...new Set([...report.accessibleBy, ...userIds])];

  await report.save();

  res.json({
    success: true,
    message: "Report shared successfully",
    data: report
  });
});

/**
 * @desc    Delete report
 * @route   DELETE /api/admin/reports/:reportId
 * @access  Private/Admin
 */
exports.deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.reportId);

  if (!report) {
    return res.status(404).json({ success: false, message: "Report not found" });
  }

  if (report.reportDetails.generatedBy.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: "You can only delete your own reports" });
  }

  await Report.findByIdAndDelete(req.params.reportId);

  res.json({ success: true, message: "Report deleted" });
});

/**
 * Helper function to generate report data
 */
async function generateReportData(category, startDate, endDate, filters = {}) {
  let dataPoints = {};
  let metrics = {};

  if (category === "financial") {
    const bills = await Billing.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    dataPoints = {
      totalRevenue: bills.reduce((sum, b) => sum + b.grossEarnings, 0),
      totalEarnings: bills.reduce((sum, b) => sum + b.grossEarnings, 0),
      totalDeductions: bills.reduce((sum, b) => sum + b.totalDeductions, 0),
      totalTaxes: bills.reduce((sum, b) => sum + b.totalTaxes, 0),
      totalBonuses: bills.reduce((sum, b) => sum + b.totalBonuses, 0),
      netProfit: bills.reduce((sum, b) => sum + b.finalAmount, 0)
    };

    metrics = {
      averageEarningsPerBill: bills.length > 0 ? dataPoints.totalEarnings / bills.length : 0,
      deductionPercent: dataPoints.totalEarnings > 0 ? (dataPoints.totalDeductions / dataPoints.totalEarnings) * 100 : 0
    };
  }

  if (category === "operational") {
    const trips = await Trip.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    dataPoints = {
      totalTrips: trips.length,
      completedTrips: trips.filter(t => t.status === "completed").length,
      cancelledTrips: trips.filter(t => t.status === "cancelled").length,
      totalDistance: trips.reduce((sum, t) => sum + (t.distance || 0), 0),
      averageRating: 4.5
    };

    metrics = {
      completionRate: trips.length > 0 ? (dataPoints.completedTrips / trips.length) * 100 : 0,
      customerSatisfaction: 4.5
    };
  }

  if (category === "driver_performance") {
    const performances = await Performance.find({
      createdAt: { $gte: startDate, $lte: endDate }
    })
      .sort({ avgRating: -1 })
      .limit(5);

    dataPoints = {
      topPerformers: performances.map(p => ({
        driverId: p.driverId,
        driverName: p.driverId.name,
        rating: p.avgRating,
        earnings: p.totalEarnings,
        trips: p.totalTrips
      }))
    };
  }

  return { dataPoints, metrics };
}
