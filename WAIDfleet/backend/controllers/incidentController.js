const Incident = require("../models/incidentModel");
const Performance = require("../models/performanceModel");
const Earnings = require("../models/earningsModel");
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

// Multer setup for incident evidence
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "video/mp4", "application/pdf"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// Upload evidence to Cloudinary
const uploadToCloudinary = async (buffer, folder = "incidents") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

// @desc    Report an incident
// @route   POST /api/incidents/report
// @access  Private
exports.reportIncident = asyncHandler(async (req, res) => {
  const { type, description, severity, reportedBy, driverId, vehicleId } = req.body;

  if (!type || !description) {
    return res.status(400).json({
      success: false,
      message: "Type and description are required",
    });
  }

  const targetDriverId = (req.user.role === 'admin' && driverId) ? driverId : req.user.id;

  const incident = new Incident({
    driverId: targetDriverId,
    vehicleId: vehicleId || null,
    type,
    description,
    severity: severity || "medium",
    reportedBy: reportedBy || (req.user.role === 'admin' ? "Admin" : "Driver"),
    status: "reported",
  });

  // Upload evidence files if provided
  if (req.files && req.files.length > 0) {
    const evidenceUrls = [];
    for (const file of req.files) {
      const url = await uploadToCloudinary(file.buffer, "incidents");
      evidenceUrls.push(url);
    }
    incident.evidenceUrl = evidenceUrls;
  }

  await incident.save();

  // Update driver's safety score
  if (severity === "high" || severity === "critical") {
    const performance = await Performance.findOne({ driverId: req.user.id });
    if (performance) {
      performance.safetyScore = Math.max(0, performance.safetyScore - 10);
      performance.incidents += 1;
      await performance.save();
    }
  }

  res.status(201).json({
    success: true,
    message: "Incident reported successfully",
    data: incident,
  });
});

// @desc    Get all incidents for a driver
// @route   GET /api/incidents
// @access  Private
exports.getIncidents = asyncHandler(async (req, res) => {
  const { status, type, from, to, page = 1, limit = 10 } = req.query;

  let filter = { driverId: req.user.id };

  if (status) filter.status = status;
  if (type) filter.type = type;

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const total = await Incident.countDocuments(filter);
  const incidents = await Incident.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: incidents,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get incident by ID
// @route   GET /api/incidents/:id
// @access  Private
exports.getIncidentById = asyncHandler(async (req, res) => {
  const incident = await Incident.findById(req.params.id).populate("driverId", "name phone");

  if (!incident) {
    return res.status(404).json({
      success: false,
      message: "Incident not found",
    });
  }

  // Check if user is authorized to view
  if (incident.driverId.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to view this incident",
    });
  }

  res.json({
    success: true,
    data: incident,
  });
});

// @desc    Resolve incident (Admin)
// @route   PUT /api/incidents/:id/resolve
// @access  Private/Admin
exports.resolveIncident = asyncHandler(async (req, res) => {
  const { status, resolution, safetyScore } = req.body;

  const incident = await Incident.findById(req.params.id);

  if (!incident) {
    return res.status(404).json({
      success: false,
      message: "Incident not found",
    });
  }

  if (status) incident.status = status;
  if (resolution) incident.resolution = resolution;
  if (safetyScore !== undefined) incident.safetyScore = safetyScore;

  if (status === "resolved" || status === "closed") {
    incident.resolvedAt = new Date();
  }

  await incident.save();

  res.json({
    success: true,
    message: "Incident updated successfully",
    data: incident,
  });
});

// @desc    Log Repair for an Incident
// @route   PUT /api/incidents/:id/repair
// @access  Private/Admin
exports.logIncidentRepair = asyncHandler(async (req, res) => {
  const { partsUsed, repairNotes, deductFromDriver } = req.body;

  const incident = await Incident.findById(req.params.id)
    .populate("driverId", "name phone")
    .populate("vehicleId", "name plateNumber");

  if (!incident) {
    return res.status(404).json({ success: false, message: "Incident not found" });
  }

  if (incident.repairCompleted) {
    return res.status(400).json({ success: false, message: "Repair already completed for this incident" });
  }

  if (!partsUsed || !Array.isArray(partsUsed) || partsUsed.length === 0) {
    return res.status(400).json({ success: false, message: "At least one part must be entered" });
  }

  // Calculate total repair cost
  const totalRepairCost = partsUsed.reduce((sum, part) => {
    return sum + (part.unitCost * part.quantity);
  }, 0);

  incident.partsUsed = partsUsed;
  incident.totalRepairCost = totalRepairCost;
  incident.repairNotes = repairNotes || '';
  incident.repairCompleted = true;
  incident.repairedDate = new Date();
  incident.status = 'resolved';
  incident.resolvedAt = new Date();
  incident.resolution = `Repair completed. Total cost: ₹${totalRepairCost.toFixed(2)}`;

  // Handle payroll deduction
  if (deductFromDriver && totalRepairCost > 0) {
    incident.payrollDeducted = true;
    incident.payrollDeductionAmount = totalRepairCost;

    // Push deduction into driver's latest earnings
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    let earning = await Earnings.findOne({
      driverId: incident.driverId._id || incident.driverId,
      period: 'monthly',
      fromDate: { $lte: today },
      toDate: { $gte: startOfMonth }
    });

    if (earning) {
      earning.advance = (earning.advance || 0) + totalRepairCost;
      earning.balance = (earning.balance || 0) - totalRepairCost;
      await earning.save();
    }
  }

  await incident.save();

  res.json({
    success: true,
    message: "Repair logged and incident resolved successfully",
    data: incident,
  });
});

// @desc    Get all incidents (Admin)
// @route   GET /api/incidents/admin/all
// @access  Private/Admin
exports.getAllIncidents = asyncHandler(async (req, res) => {
  const { driverId, status, severity, type, from, to, page = 1, limit = 10 } = req.query;

  let filter = {};

  if (driverId) filter.driverId = driverId;
  if (status) filter.status = status;
  if (severity) filter.severity = severity;
  if (type) filter.type = type;

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const total = await Incident.countDocuments(filter);
  const incidents = await Incident.find(filter)
    .populate("driverId", "name phone email")
    .populate("vehicleId", "name plateNumber type")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: incidents,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get incident statistics
// @route   GET /api/incidents/stats/dashboard
// @access  Private/Admin
exports.getIncidentStats = asyncHandler(async (req, res) => {
  const { driverId, from, to } = req.query;

  let filter = {};
  if (driverId) filter.driverId = driverId;

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const stats = await Incident.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        avgSafetySeverity: { $avg: "$safetyScore" },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const severityStats = await Incident.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$severity",
        count: { $sum: 1 },
      },
    },
  ]);

  const totalIncidents = await Incident.countDocuments(filter);
  const resolvedIncidents = await Incident.countDocuments({
    ...filter,
    status: { $in: ["resolved", "closed"] },
  });

  res.json({
    success: true,
    data: {
      totalIncidents,
      resolvedIncidents,
      pendingIncidents: totalIncidents - resolvedIncidents,
      byType: stats,
      bySeverity: severityStats,
    },
  });
});

module.exports.upload = upload.array("evidence", 5); // Allow max 5 files
module.exports.logIncidentRepair = exports.logIncidentRepair;
