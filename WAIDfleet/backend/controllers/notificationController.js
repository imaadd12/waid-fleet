const asyncHandler = require("express-async-handler");
const { NotificationTemplate, NotificationLog, UserNotificationPreferences, InAppNotification, Notification } = require("../models/notificationModel");
const { generateUniqueId } = require("../utils/helpers");

// ===== NOTIFICATION TEMPLATE OPERATIONS =====

// @desc    Create notification template
// @route   POST /api/notifications/templates
// @access  Private (Admin only)
const createNotificationTemplate = asyncHandler(async (req, res) => {
  const { templateId, name, category, channels, content, variables, priority } = req.body;

  if (!templateId || !name || !category) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const template = await NotificationTemplate.create({
    templateId,
    name,
    category,
    channels,
    content,
    variables: variables || [],
    priority,
    createdBy: req.user.id
  });

  res.status(201).json({ success: true, data: template, message: 'Template created successfully' });
});

// @desc    Get notification templates
// @route   GET /api/notifications/templates
// @access  Private
const getNotificationTemplates = asyncHandler(async (req, res) => {
  const { category, isActive = true, limit = 50, skip = 0 } = req.query;
  let filter = { isActive };
  if (category) filter.category = category;

  const templates = await NotificationTemplate.find(filter)
    .sort('-createdAt')
    .limit(parseInt(limit))
    .skip(parseInt(skip));

  const total = await NotificationTemplate.countDocuments(filter);

  res.status(200).json({ success: true, data: templates, total, count: templates.length });
});

// ===== SEND NOTIFICATIONS =====

// @desc    Send notification to single recipient
// @route   POST /api/notifications/send
// @access  Private
const sendNotification = asyncHandler(async (req, res) => {
  const { recipientId, recipientType, templateId, channels, content, triggerEvent } = req.body;

  if (!recipientId || !recipientType) {
    return res.status(400).json({ message: 'Missing recipient information' });
  }

  const notificationLog = await NotificationLog.create({
    recipientId,
    recipientType,
    templateId,
    channels: {
      sms: { ...channels?.sms, status: 'pending' },
      email: { ...channels?.email, status: 'pending' },
      push: { ...channels?.push, status: 'pending' },
      inApp: { ...channels?.inApp, status: 'pending' }
    },
    content,
    triggerEvent,
    status: 'pending'
  });

  // Create in-app notification
  if (channels?.inApp) {
    await InAppNotification.create({
      userId: recipientId,
      userType: recipientType,
      title: content?.title,
      body: content?.body,
      category: content?.category || 'update'
    });
  }

  sendNotificationAsync(notificationLog);

  res.status(200).json({ success: true, data: notificationLog, message: 'Notification queued for sending' });
});

// @desc    Send bulk notifications
// @route   POST /api/notifications/send-bulk
// @access  Private (Admin only)
const sendBulkNotifications = asyncHandler(async (req, res) => {
  const { recipientIds, templateId, channels, content } = req.body;

  if (!recipientIds || recipientIds.length === 0) {
    return res.status(400).json({ message: 'No recipients provided' });
  }

  const notifications = await Promise.all(
    recipientIds.map(recipientId =>
      NotificationLog.create({
        recipientId,
        recipientType: 'driver',
        templateId,
        channels,
        content,
        status: 'pending'
      })
    )
  );

  res.status(200).json({ success: true, data: { count: notifications.length }, message: 'Bulk notifications queued' });
});

// ===== NOTIFICATION LOGS =====

// @desc    Get notification logs
// @route   GET /api/notifications/logs
// @access  Private (Admin only)
const getNotificationLogs = asyncHandler(async (req, res) => {
  const { status, recipientType, limit = 50, skip = 0 } = req.query;
  let filter = {};
  if (status) filter.status = status;
  if (recipientType) filter.recipientType = recipientType;

  const logs = await NotificationLog.find(filter)
    .sort('-createdAt')
    .limit(parseInt(limit))
    .skip(parseInt(skip));

  const total = await NotificationLog.countDocuments(filter);

  res.status(200).json({ success: true, data: logs, total, count: logs.length });
});

// ===== IN-APP NOTIFICATIONS =====

// @desc    Get all notifications for a driver (backward compatible)
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const { driverId, isRead, type, page = 1, limit = 20 } = req.query;

  let query = {};
  if (driverId) query.driverId = driverId;
  if (isRead !== undefined) query.isRead = isRead === 'true';
  if (type) query.type = type;

  const skip = (page - 1) * limit;

  const notifications = await Notification.find(query)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ driverId, isRead: false });

  res.json({
    success: true,
    count: notifications.length,
    total,
    unreadCount,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: notifications
  });
});

// @desc    Get in-app notifications (new system)
// @route   GET /api/notifications/in-app/:userId
// @access  Private
const getInAppNotifications = asyncHandler(async (req, res) => {
  const { isRead, limit = 50, skip = 0 } = req.query;
  let filter = { userId: req.params.userId };
  if (isRead !== undefined) filter.isRead = isRead === 'true';

  const notifications = await InAppNotification.find(filter)
    .sort('-createdAt')
    .limit(parseInt(limit))
    .skip(parseInt(skip));

  const total = await InAppNotification.countDocuments(filter);
  const unreadCount = await InAppNotification.countDocuments({ userId: req.params.userId, isRead: false });

  res.status(200).json({ success: true, data: notifications, total, unreadCount, count: notifications.length });
});

// @desc    Get single notification
// @route   GET /api/notifications/:id
// @access  Private
const getNotificationById = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.json({ success: true, data: notification });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  res.json({ success: true, message: 'Notification marked as read', data: notification });
});

// @desc    Mark in-app notification as read
// @route   PUT /api/notifications/in-app/:id/read
// @access  Private
const markInAppNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await InAppNotification.findByIdAndUpdate(
    req.params.id,
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  res.status(200).json({ success: true, data: notification });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  const { driverId } = req.body;

  if (!driverId) {
    res.status(400);
    throw new Error('Driver ID is required');
  }

  await Notification.updateMany(
    { driverId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  res.json({ success: true, message: 'All notifications marked as read' });
});

// @desc    Update notification status
// @route   PUT /api/notifications/:id/status
// @access  Private
const updateNotificationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['pending', 'acknowledged', 'completed', 'dismissed'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.json({ success: true, message: 'Notification status updated', data: notification });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await InAppNotification.findByIdAndUpdate(
    req.params.id,
    { isArchived: true, archivedAt: new Date() },
    { new: true }
  );

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.json({ success: true, message: 'Notification archived' });
});

// @desc    Create service reminder notification
// @route   POST /api/notifications/service-reminder
// @access  Private (Admin/System only)
const createServiceReminder = asyncHandler(async (req, res) => {
  const { driverId, vehicleId, serviceScheduleId, message, dueDate } = req.body;

  if (!driverId || !vehicleId || !serviceScheduleId) {
    res.status(400);
    throw new Error('driverId, vehicleId, and serviceScheduleId are required');
  }

  const notification = await Notification.create({
    driverId,
    vehicleId,
    serviceScheduleId,
    type: 'service_reminder',
    title: `🔧 Vehicle Service Reminder`,
    message: message || 'Your vehicle is due for service. Please book an appointment.',
    priority: 'high',
    dueDate: new Date(dueDate),
    status: 'pending'
  });

  res.status(201).json({ success: true, message: 'Service reminder created', data: notification });
});

// ===== NOTIFICATION PREFERENCES =====

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences/:userId
// @access  Private
const getNotificationPreferences = asyncHandler(async (req, res) => {
  let preferences = await UserNotificationPreferences.findOne({ userId: req.params.userId });

  if (!preferences) {
    preferences = await UserNotificationPreferences.create({
      userId: req.params.userId,
      userType: req.query.userType || 'driver'
    });
  }

  res.status(200).json({ success: true, data: preferences });
});

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences/:userId
// @access  Private
const updateNotificationPreferences = asyncHandler(async (req, res) => {
  let preferences = await UserNotificationPreferences.findOne({ userId: req.params.userId });

  if (!preferences) {
    preferences = await UserNotificationPreferences.create({
      userId: req.params.userId,
      ...req.body
    });
  } else {
    Object.assign(preferences, req.body);
    await preferences.save();
  }

  res.status(200).json({ success: true, data: preferences, message: 'Preferences updated' });
});

// Helper function to send notifications asynchronously
const sendNotificationAsync = async (notificationLog) => {
  setTimeout(async () => {
    try {
      const updates = { status: 'sent', sentAt: new Date() };
      if (notificationLog.channels.sms?.sent !== false) {
        updates['channels.sms.status'] = 'sent';
        updates['channels.sms.sent'] = true;
      }
      if (notificationLog.channels.email?.sent !== false) {
        updates['channels.email.status'] = 'sent';
        updates['channels.email.sent'] = true;
      }
      if (notificationLog.channels.push?.sent !== false) {
        updates['channels.push.status'] = 'sent';
        updates['channels.push.sent'] = true;
      }
      await NotificationLog.findByIdAndUpdate(notificationLog._id, updates);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, 1000);
};

module.exports = {
  createNotificationTemplate,
  getNotificationTemplates,
  sendNotification,
  sendBulkNotifications,
  getNotificationLogs,
  getNotifications,
  getInAppNotifications,
  getNotificationById,
  markAsRead,
  markInAppNotificationAsRead,
  markAllAsRead,
  updateNotificationStatus,
  deleteNotification,
  createServiceReminder,
  getNotificationPreferences,
  updateNotificationPreferences
};
