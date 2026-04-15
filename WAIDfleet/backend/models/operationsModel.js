const mongoose = require('mongoose');

// Vehicle Maintenance Schema
const vehicleMaintenanceSchema = new mongoose.Schema({
  maintenanceId: {
    type: String,
    required: true,
    unique: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    index: true
  },
  serviceType: {
    type: String,
    enum: ['oil_change', 'filter_replacement', 'tire_rotation', 'brake_service', 'battery_replacement', 'washing', 'inspection', 'repair', 'major_service', 'minor_service', 'emergency'],
    required: true
  },
  description: String,
  serviceDate: {
    type: Date,
    required: true,
    index: true
  },
  completionDate: Date,
  estimatedCost: Number,
  actualCost: Number,
  vendor: {
    vendorId: mongoose.Schema.Types.ObjectId,
    vendorName: String,
    vendorPhone: String,
    vendorAddress: String
  },
  mileageAtService: Number,
  mileageAtNextService: Number,
  issues: [String],
  resolution: String,
  partsReplaced: [
    {
      partName: String,
      cost: Number,
      warranty: String
    }
  ],
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled',
    index: true
  },
  priority: {
    type: String,
    enum: ['routine', 'urgent', 'emergency'],
    default: 'routine'
  },
  notes: String,
  attachments: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Vehicle Health Score Schema
const vehicleHealthScoreSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    unique: true,
    index: true
  },
  overallScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  metrics: {
    engineHealth: { type: Number, default: 100, min: 0, max: 100 },
    batteryHealth: { type: Number, default: 100, min: 0, max: 100 },
    tyreHealth: { type: Number, default: 100, min: 0, max: 100 },
    brakeHealth: { type: Number, default: 100, min: 0, max: 100 },
    insuranceStatus: { type: Number, default: 100, min: 0, max: 100 },
    registrationStatus: { type: Number, default: 100, min: 0, max: 100 },
    pollutionStatus: { type: Number, default: 100, min: 0, max: 100 },
    fitnessStatus: { type: Number, default: 100, min: 0, max: 100 }
  },
  nextMaintenanceDate: Date,
  warnings: [
    {
      type: String,
      severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
      description: String,
      actionRequired: Boolean
    }
  ],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Promo Code Schema
const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'free_ride', 'cashback', 'credit'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  description: String,
  applicableTo: {
    type: String,
    enum: ['all', 'drivers', 'passengers', 'new_users', 'returning_users'],
    default: 'all'
  },
  rideType: {
    type: String,
    enum: ['all', 'economy', 'premium', 'xl', 'share', 'bike']
  },
  minTripFare: { type: Number, default: 0 },
  maxDiscount: Number,
  maxUses: { type: Number, default: -1 },
  maxUsesPerUser: { type: Number, default: 1 },
  usageCount: { type: Number, default: 0 },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'disabled', 'draft'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  usageHistory: [
    {
      userId: mongoose.Schema.Types.ObjectId,
      rideId: mongoose.Schema.Types.ObjectId,
      usedAt: Date,
      discountAmount: Number
    }
  ],
  terms: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Scheduled Task Schema (for cron jobs)
const scheduledTaskSchema = new mongoose.Schema({
  taskName: {
    type: String,
    required: true,
    index: true
  },
  taskType: {
    type: String,
    enum: ['driver_verification', 'payout', 'report', 'cleanup', 'email', 'notification', 'analytics', 'backup', 'custom'],
    required: true
  },
  frequency: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly', 'custom', 'once'],
    required: true
  },
  cronExpression: String,
  nextRunTime: {
    type: Date,
    index: true
  },
  lastRunTime: Date,
  status: {
    type: String,
    enum: ['active', 'paused', 'failed', 'completed'],
    default: 'active'
  },
  configuration: mongoose.Schema.Types.Mixed,
  logs: [
    {
      runTime: Date,
      status: String,
      duration: Number,
      result: String,
      errorMessages: [String]
    }
  ],
  retryPolicy: {
    maxRetries: { type: Number, default: 3 },
    retryDelay: { type: Number, default: 300000 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Webhook Subscription Schema
const webhookSubscriptionSchema = new mongoose.Schema({
  subscriptionId: {
    type: String,
    required: true,
    unique: true
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  businessName: String,
  events: [
    {
      type: String,
      enum: ['trip.created', 'trip.accepted', 'trip.started', 'trip.completed', 'trip.cancelled', 'payment.received', 'driver.verified', 'driver.onboarded', 'driver.suspended']
    }
  ],
  callbackUrl: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  apiVersion: {
    type: String,
    default: 'v1'
  },
  retryPolicy: {
    maxRetries: { type: Number, default: 5 },
    backoffMultiplier: { type: Number, default: 2 },
    maxBackoffTime: { type: Number, default: 3600000 }
  },
  headers: mongoose.Schema.Types.Mixed,
  authentication: {
    type: { type: String, enum: ['api_key', 'oauth2', 'bearer_token'], default: 'api_key' },
    credentials: String
  },
  trafficLimits: {
    requestsPerSecond: { type: Number, default: 100 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Webhook Log Schema
const webhookLogSchema = new mongoose.Schema({
  subscriptionId: {
    type: String,
    required: true,
    index: true
  },
  event: {
    type: String,
    required: true,
    index: true
  },
  payload: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['sent', 'failed', 'retrying', 'bounced'],
    default: 'sent',
    index: true
  },
  attempts: {
    type: Number,
    default: 1
  },
  lastAttemptTime: Date,
  nextRetryTime: Date,
  responseCode: Number,
  responseBody: String,
  responseTime: Number,
  error: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
    expires: 2592000 // Auto-delete after 30 days
  }
});

// Create indexes
vehicleMaintenanceSchema.index({ vehicleId: 1, serviceDate: -1 });
vehicleMaintenanceSchema.index({ status: 1, serviceDate: 1 });
vehicleHealthScoreSchema.index({ overallScore: 1 });
promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ status: 1, validUntil: 1 });
scheduledTaskSchema.index({ taskType: 1, status: 1 });
scheduledTaskSchema.index({ nextRunTime: 1, status: 1 });
webhookSubscriptionSchema.index({ businessId: 1, isActive: 1 });
webhookLogSchema.index({ subscriptionId: 1, createdAt: -1 });
webhookLogSchema.index({ status: 1, createdAt: -1 });

module.exports = {
  VehicleMaintenance: mongoose.model('VehicleMaintenance', vehicleMaintenanceSchema),
  VehicleHealthScore: mongoose.model('VehicleHealthScore', vehicleHealthScoreSchema),
  PromoCode: mongoose.model('PromoCode', promoCodeSchema),
  ScheduledTask: mongoose.model('ScheduledTask', scheduledTaskSchema),
  WebhookSubscription: mongoose.model('WebhookSubscription', webhookSubscriptionSchema),
  WebhookLog: mongoose.model('WebhookLog', webhookLogSchema)
};
