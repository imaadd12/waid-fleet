const SupportTicket = require("../models/supportTicketModel");
const Driver = require("../models/driverModel");
const asyncHandler = require("express-async-handler");

/**
 * @desc    Create support ticket
 * @route   POST /api/admin/tickets
 * @access  Private
 */
exports.createTicket = asyncHandler(async (req, res) => {
  const { category, priority, subject, description, driverId } = req.body;

  const ticket = await SupportTicket.create({
    category,
    priority,
    subject,
    description,
    reportedBy: req.body.reportedBy || "admin",
    driverId: driverId || null,
    createdBy: req.user.id,
    messages: [
      {
        authorId: req.user.id,
        authorType: "admin",
        message: description,
        timestamp: new Date()
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: "Support ticket created",
    data: ticket
  });
});

/**
 * @desc    Get all support tickets
 * @route   GET /api/admin/tickets
 * @access  Private
 */
exports.getAllTickets = asyncHandler(async (req, res) => {
  const { status = "all", priority = "all", assignedTo, sortBy = "createdAt", page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status !== "all") filter.status = status;
  if (priority !== "all") filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;

  const total = await SupportTicket.countDocuments(filter);
  const tickets = await SupportTicket.find(filter)
    .populate("driverId", "name phone")
    .populate("assignedTo", "name email")
    .populate("createdBy", "name")
    .sort({ [sortBy]: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: tickets,
    pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
  });
});

/**
 * @desc    Get ticket by ID
 * @route   GET /api/admin/tickets/:ticketId
 * @access  Private
 */
exports.getTicketById = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.ticketId)
    .populate("driverId", "name phone email")
    .populate("assignedTo", "name email")
    .populate("messages.authorId", "name email role");

  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  res.json({ success: true, data: ticket });
});

/**
 * @desc    Assign ticket to admin
 * @route   PUT /api/admin/tickets/:ticketId/assign
 * @access  Private/Admin
 */
exports.assignTicket = asyncHandler(async (req, res) => {
  const { assignedToId } = req.body;

  const ticket = await SupportTicket.findById(req.params.ticketId);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  ticket.assignedTo = assignedToId;
  ticket.status = "in_progress";
  ticket.updatedBy = req.user.id;

  // Record first response
  if (!ticket.slaData.firstResponseAt) {
    ticket.slaData.firstResponseAt = new Date();
  }

  await ticket.save();

  res.json({
    success: true,
    message: "Ticket assigned successfully",
    data: ticket
  });
});

/**
 * @desc    Add message to ticket
 * @route   POST /api/admin/tickets/:ticketId/message
 * @access  Private
 */
exports.addTicketMessage = asyncHandler(async (req, res) => {
  const { message, attachments } = req.body;

  const ticket = await SupportTicket.findById(req.params.ticketId);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  ticket.messages.push({
    authorId: req.user.id,
    authorType: "admin",
    message,
    attachments: attachments || [],
    timestamp: new Date()
  });

  if (ticket.status === "waiting") {
    ticket.status = "in_progress";
  }

  ticket.updatedBy = req.user.id;

  await ticket.save();

  res.json({
    success: true,
    message: "Message added successfully",
    data: ticket
  });
});

/**
 * @desc    Resolve ticket
 * @route   PUT /api/admin/tickets/:ticketId/resolve
 * @access  Private/Admin
 */
exports.resolveTicket = asyncHandler(async (req, res) => {
  const { resolution } = req.body;

  const ticket = await SupportTicket.findById(req.params.ticketId);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  ticket.status = "resolved";
  ticket.resolution = {
    description: resolution,
    resolvedAt: new Date(),
    resolvedBy: req.user.id
  };

  // Calculate SLA
  if (ticket.slaData.firstResponseAt && ticket.slaData.resolutionTargetTime) {
    ticket.slaData.actualResolutionTime = new Date();
    ticket.slaData.slaBreached = new Date() > ticket.slaData.resolutionTargetTime;
  }

  ticket.updatedBy = req.user.id;

  await ticket.save();

  res.json({
    success: true,
    message: "Ticket resolved successfully",
    data: ticket
  });
});

/**
 * @desc    Close ticket
 * @route   PUT /api/admin/tickets/:ticketId/close
 * @access  Private/Admin
 */
exports.closeTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.ticketId);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  ticket.status = "closed";
  ticket.updatedBy = req.user.id;

  await ticket.save();

  res.json({
    success: true,
    message: "Ticket closed",
    data: ticket
  });
});

/**
 * @desc    Reopen ticket
 * @route   PUT /api/admin/tickets/:ticketId/reopen
 * @access  Private
 */
exports.reopenTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.ticketId);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  ticket.status = "reopened";
  ticket.updatedBy = req.user.id;

  await ticket.save();

  res.json({
    success: true,
    message: "Ticket reopened",
    data: ticket
  });
});

/**
 * @desc    Add customer satisfaction rating
 * @route   PUT /api/admin/tickets/:ticketId/satisfaction
 * @access  Private
 */
exports.addSatisfactionRating = asyncHandler(async (req, res) => {
  const { rating, feedback } = req.body;

  const ticket = await SupportTicket.findById(req.params.ticketId);
  if (!ticket) {
    return res.status(404).json({ success: false, message: "Ticket not found" });
  }

  ticket.customerSatisfaction = {
    rating,
    feedback,
    ratedAt: new Date()
  };

  await ticket.save();

  res.json({
    success: true,
    message: "Satisfaction rating saved",
    data: ticket
  });
});

/**
 * @desc    Get ticket statistics
 * @route   GET /api/admin/tickets/stats/summary
 * @access  Private/Admin
 */
exports.getTicketStats = asyncHandler(async (req, res) => {
  const stats = {
    total: await SupportTicket.countDocuments(),
    open: await SupportTicket.countDocuments({ status: "open" }),
    inProgress: await SupportTicket.countDocuments({ status: "in_progress" }),
    resolved: await SupportTicket.countDocuments({ status: "resolved" }),
    closed: await SupportTicket.countDocuments({ status: "closed" }),
    byPriority: {
      low: await SupportTicket.countDocuments({ priority: "low" }),
      medium: await SupportTicket.countDocuments({ priority: "medium" }),
      high: await SupportTicket.countDocuments({ priority: "high" }),
      critical: await SupportTicket.countDocuments({ priority: "critical" })
    },
    avgResolutionTime: 0,
    avgResponseTime: 0,
    slaCompliance: 0
  };

  // Calculate averages
  const tickets = await SupportTicket.find({ resolution: { $exists: true, $ne: null } });
  if (tickets.length > 0) {
    let totalResolutionTime = 0;
    let totalResponseTime = 0;
    let slaCompliant = 0;

    tickets.forEach(ticket => {
      if (ticket.slaData.firstResponseAt && ticket.createdAt) {
        totalResponseTime += ticket.slaData.firstResponseAt - ticket.createdAt;
      }
      if (ticket.slaData.actualResolutionTime && ticket.createdAt) {
        totalResolutionTime += ticket.slaData.actualResolutionTime - ticket.createdAt;
      }
      if (!ticket.slaData.slaBreached) {
        slaCompliant++;
      }
    });

    stats.avgResponseTime = Math.round(totalResponseTime / tickets.length / 1000 / 60); // minutes
    stats.avgResolutionTime = Math.round(totalResolutionTime / tickets.length / 1000 / 60); // minutes
    stats.slaCompliance = ((slaCompliant / tickets.length) * 100).toFixed(2);
  }

  res.json({ success: true, data: stats });
});
