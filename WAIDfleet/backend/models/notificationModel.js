const mongoose = require("mongoose");

// Notification Template Schema (for reusable templates)
const notificationTemplateSchema = new mongoose.Schema({
  templateId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, enum: ["alert", "update", "promo", "system", "earnings", "document", "support", "service"], required: true },
  channels: {
    sms: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
    push: { type: Boolean, default: false },
    inApp: { type: Boolean, default: true }
  },
  content: {
    sms: { type: String, maxlength: 160 },
    email: { subject: String, body: String, footer: String, htmlTemplate: String },
    push: { title: String, body: String, image: String },
    inApp: { title: String, body: String, cta: String, icon: String }
  },
  variables: [String],
  priority: { type: String, enum: ["low", "normal", "high", "critical"], default: "normal" },
  retryPolicy: {
    maxRetries: { type: Number, default: 3 },
    retryDelay: { type: Number, default: 300000 }
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Comprehensive Notification Log Schema
const notificationLogSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  recipientType: { type: String, enum: ["driver", "admin", "passenger"], required: true },
  templateId: { type: String, ref: "NotificationTemplate" },
  templateName: String,
  channels: {
    sms: {
      sent: { type: Boolean, default: false },
      status: { type: String, enum: ["pending", "sent", "failed", "bounced"], default: "pending" },
      timestamp: Date,
      provider: String,
      providerMessageId: String
    },
    email: {
      sent: { type: Boolean, default: false },
      status: { type: String, enum: ["pending", "sent", "failed", "bounced", "opened", "clicked"], default: "pending" },
      timestamp: Date,
      provider: String,
      providerMessageId: String
    },
    push: {
      sent: { type: Boolean, default: false },
      status: { type: String, enum: ["pending", "sent", "failed", "delivered"], default: "pending" },
      timestamp: Date,
      provider: String,
      providerMessageId: String
    },
    inApp: {
      created: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      timestamp: Date,
      readAt: Date
    }
  },
  content: mongoose.Schema.Types.Mixed,
  triggerEvent: String,
  relatedEntity: { type: String, entityId: mongoose.Schema.Types.ObjectId },
  status: { type: String, enum: ["pending", "sending", "sent", "failed", "cancelled"], default: "pending", index: true },
  retries: { type: Number, default: 0 },
  deliveryErrors: [{ channel: String, error: String, timestamp: Date }],
  createdAt: { type: Date, default: Date.now, index: true, expires: 2592000 },
  sentAt: Date
}, { timestamps: true });

// User Notification Preferences Schema
const userNotificationPreferencesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true, index: true },
  userType: { type: String, enum: ["driver", "admin", "passenger"], required: true },
  channels: {
    sms: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true }
  },
  categories: {
    alerts: { type: Boolean, default: true },
    earnings: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    system: { type: Boolean, default: true },
    updates: { type: Boolean, default: true },
    support: { type: Boolean, default: true },
    documents: { type: Boolean, default: true }
  },
  quietHours: {
    enabled: { type: Boolean, default: false },
    startTime: String,
    endTime: String,
    respectQuietHours: { type: Boolean, default: false }
  },
  language: { type: String, enum: ["en", "hi", "es", "fr"], default: "en" },
  timezone: { type: String, default: "Asia/Kolkata" },
  frequencyLimits: {
    maxNotificationsPerDay: { type: Number, default: 50 },
    maxNotificationsPerHour: { type: Number, default: 10 }
  },
  doNotDisturbDays: [{ type: String, enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// In-App Notification Schema
const inAppNotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  userType: { type: String, enum: ["driver", "admin", "passenger"], required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: { type: String, enum: ["alert", "info", "success", "error", "warning"], default: "info" },
  icon: String,
  image: String,
  actionUrl: String,
  actionLabel: String,
  priority: { type: String, enum: ["low", "normal", "high", "critical"], default: "normal" },
  category: { type: String, enum: ["alert", "update", "promo", "system", "earnings", "document", "support", "service"], default: "update" },
  isRead: { type: Boolean, default: false, index: true },
  readAt: Date,
  isArchived: { type: Boolean, default: false },
  archivedAt: Date,
  expiresAt: Date,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

// Original Notification Schema (backward compatibility)
const notificationSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  serviceScheduleId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceSchedule" },
  type: { type: String, enum: ["service_reminder", "service_due", "service_overdue", "maintenance", "general"], default: "general" },
  title: String,
  message: String,
  isRead: { type: Boolean, default: false },
  readAt: Date,
  actionUrl: String,
  priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
  dueDate: Date,
  status: { type: String, enum: ["pending", "acknowledged", "completed", "dismissed"], default: "pending" }
}, { timestamps: true });

// Create indexes
notificationTemplateSchema.index({ category: 1, isActive: 1 });
notificationLogSchema.index({ recipientId: 1, createdAt: -1 });
notificationLogSchema.index({ status: 1, createdAt: -1 });
userNotificationPreferencesSchema.index({ userType: 1 });
inAppNotificationSchema.index({ userId: 1, isRead: 1 });
inAppNotificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ driverId: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ type: 1 });

module.exports = {
  NotificationTemplate: mongoose.model("NotificationTemplate", notificationTemplateSchema),
  NotificationLog: mongoose.model("NotificationLog", notificationLogSchema),
  UserNotificationPreferences: mongoose.model("UserNotificationPreferences", userNotificationPreferencesSchema),
  InAppNotification: mongoose.model("InAppNotification", inAppNotificationSchema),
  Notification: mongoose.model("Notification", notificationSchema)
};
