const mongoose = require('mongoose');

// Analytics Snapshot Schema (Daily)
const analyticsSnapshotSchema = new mongoose.Schema({
  date: {
    type: Date,
    index: true,
    unique: true
  },
  metrics: {
    totalTrips: { type: Number, default: 0 },
    completedTrips: { type: Number, default: 0 },
    cancelledTrips: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    platformCommission: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    driverPayouts: { type: Number, default: 0 },
    activeDrivers: { type: Number, default: 0 },
    totalDrivers: { type: Number, default: 0 },
    newDrivers: { type: Number, default: 0 },
    verifiedDrivers: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    cancellationRate: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    incidents: { type: Number, default: 0 },
    supportTickets: { type: Number, default: 0 },
    resolvedTickets: { type: Number, default: 0 }
  },
  trends: {
    peakHours: [
      {
        hour: Number,
        tripCount: Number
      }
    ],
    topRoutes: [
      {
        route: String,
        tripCount: Number,
        revenue: Number
      }
    ],
    topVehicleTypes: [
      {
        vehicleType: String,
        tripCount: Number,
        revenue: Number
      }
    ]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Driver Performance Score Schema
const driverScoreSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
    unique: true,
    index: true
  },
  totalScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  scores: {
    safety: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    reliability: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    communication: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    efficiency: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    compliance: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    professionalism: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  metrics: {
    totalTrips: { type: Number, default: 0 },
    completedTrips: { type: Number, default: 0 },
    cancelledTrips: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    incidents: { type: Number, default: 0 },
    violations: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    onTimeRate: { type: Number, default: 0 }
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'elite'],
    default: 'bronze'
  },
  badges: [
    {
      name: String,
      icon: String,
      awardedAt: Date
    }
  ],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  calculatedAt: Date
});

// Revenue Forecast Schema
const revenueForecastSchema = new mongoose.Schema({
  forecastId: {
    type: String,
    required: true,
    unique: true
  },
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  forecastPeriod: {
    start: Date,
    end: Date
  },
  predictions: [
    {
      date: Date,
      predictedRevenue: Number,
      confidence: { type: Number, min: 0, max: 1 },
      min: Number,
      max: Number,
      trend: { type: String, enum: ['up', 'down', 'stable'] }
    }
  ],
  model: {
    type: String,
    enum: ['linear_regression', 'arima', 'ml', 'exponential_smoothing'],
    default: 'linear_regression'
  },
  accuracy: {
    type: Number,
    min: 0,
    max: 1
  },
  factors: [
    {
      name: String,
      impact: { type: String, enum: ['positive', 'negative', 'neutral'] },
      percentage: Number
    }
  ],
  historicalData: {
    trainingDataPoints: Number,
    lastActualValue: Number,
    lastActualDate: Date
  },
  isActive: { type: Boolean, default: true },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Key Performance Indicator (KPI) Schema
const kpiSchema = new mongoose.Schema({
  date: {
    type: Date,
    index: true
  },
  kpis: {
    riderAcquisition: {
      newUsers: Number,
      activationRate: Number
    },
    driverAcquisition: {
      newDrivers: Number,
      verificationRate: Number,
      activationRate: Number
    },
    engagement: {
      dailyActiveUsers: Number,
      rideFrequency: Number,
      repeatRideRate: Number
    },
    retention: {
      monthlyRetentionRate: Number,
      churnRate: Number
    },
    financial: {
      gmu: Number, // Gross Merchandise Value
      arpu: Number, // Average Revenue Per User
      ltv: Number, // Lifetime Value
      cac: Number // Customer Acquisition Cost
    },
    operational: {
      supplySidePenetration: Number,
      demandSidePenetration: Number,
      averageWaitTime: Number,
      acceptanceRate: Number,
      completionRate: Number
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Custom Report Schema (for advanced analytics)
const customReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  description: String,
  metrics: [String],
  filters: mongoose.Schema.Types.Mixed,
  groupBy: [String],
  sortBy: String,
  sortOrder: { type: String, enum: ['asc', 'desc'], default: 'desc' },
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  dateRange: {
    start: Date,
    end: Date
  },
  data: mongoose.Schema.Types.Mixed,
  format: { type: String, enum: ['json', 'csv', 'excel', 'pdf'], default: 'json' },
  isScheduled: { type: Boolean, default: false },
  schedule: {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    nextRun: Date
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

// Create indexes
analyticsSnapshotSchema.index({ date: -1 });
driverScoreSchema.index({ totalScore: -1, tier: 1 });
driverScoreSchema.index({ lastUpdated: -1 });
revenueForecastSchema.index({ 'forecastPeriod.start': 1, isActive: 1 });
kpiSchema.index({ date: -1 });
customReportSchema.index({ createdAt: -1 });
customReportSchema.index({ isScheduled: 1 });

module.exports = {
  AnalyticsSnapshot: mongoose.model('AnalyticsSnapshot', analyticsSnapshotSchema),
  DriverScore: mongoose.model('DriverScore', driverScoreSchema),
  RevenueForecast: mongoose.model('RevenueForecast', revenueForecastSchema),
  KPI: mongoose.model('KPI', kpiSchema),
  CustomReport: mongoose.model('CustomReport', customReportSchema)
};
