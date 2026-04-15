const mongoose = require('mongoose');

// Live Location Schema
const liveLocationSchema = new mongoose.Schema({
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
    index: true
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  latitude: {
    type: Number,
    required: true,
    validate: {
      validator: (v) => v >= -90 && v <= 90,
      message: 'Latitude must be between -90 and 90'
    }
  },
  longitude: {
    type: Number,
    required: true,
    validate: {
      validator: (v) => v >= -180 && v <= 180,
      message: 'Longitude must be between -180 and 180'
    }
  },
  accuracy: {
    type: Number,
    default: 0,
    min: 0
  },
  speed: {
    type: Number,
    default: 0,
    min: 0
  },
  heading: {
    type: Number,
    default: 0
  },
  altitude: Number,
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
    expires: 86400 // Auto-delete after 24 hours
  }
}, { timestamps: true });

// Geofence Schema
const geofenceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  latitude: {
    type: Number,
    required: true,
    validate: {
      validator: (v) => v >= -90 && v <= 90,
      message: 'Latitude must be between -90 and 90'
    }
  },
  longitude: {
    type: Number,
    required: true,
    validate: {
      validator: (v) => v >= -180 && v <= 180,
      message: 'Longitude must be between -180 and 180'
    }
  },
  radius: {
    type: Number,
    required: true,
    min: 10,
    max: 50000,
    default: 500
  },
  type: {
    type: String,
    enum: ['pickup', 'dropoff', 'restricted', 'hub', 'premium_zone'],
    required: true
  },
  alertType: {
    type: String,
    enum: ['enter', 'exit', 'both'],
    default: 'both'
  },
  notifyAdmins: {
    type: Boolean,
    default: false
  },
  notifyDriver: {
    type: Boolean,
    default: false
  },
  alertMessage: String,
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Route History Schema
const routeHistorySchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true,
    index: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
    index: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  startPoint: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  endPoint: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  distance: {
    type: Number,
    default: 0,
    min: 0
  },
  duration: {
    type: Number,
    default: 0,
    min: 0
  },
  avgSpeed: {
    type: Number,
    default: 0,
    min: 0
  },
  maxSpeed: {
    type: Number,
    default: 0,
    min: 0
  },
  route: [
    {
      latitude: Number,
      longitude: Number,
      timestamp: Date,
      speed: Number,
      accuracy: Number
    }
  ],
  efficiency: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  deviationFromPlannedRoute: {
    type: Number,
    default: 0,
    min: 0
  },
  violations: [
    {
      type: {
        type: String,
        enum: ['speeding', 'harsh_acceleration', 'harsh_braking', 'sharp_turn', 'geofence_breach'],
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      timestamp: Date,
      location: {
        latitude: Number,
        longitude: Number
      },
      details: String
    }
  ],
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Geofence Alert Schema
const geofenceAlertSchema = new mongoose.Schema({
  geofenceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Geofence',
    required: true,
    index: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true,
    index: true
  },
  alertType: {
    type: String,
    enum: ['enter', 'exit'],
    required: true
  },
  location: {
    latitude: Number,
    longitude: Number
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  notificationSent: {
    admin: { type: Boolean, default: false },
    driver: { type: Boolean, default: false }
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info'
  }
}, { timestamps: true });

// Create compound indexes
liveLocationSchema.index({ driverId: 1, timestamp: -1 });
geofenceSchema.index({ type: 1, isActive: 1 });
routeHistorySchema.index({ driverId: 1, createdAt: -1 });
geofenceAlertSchema.index({ driverId: 1, timestamp: -1 });

module.exports = {
  LiveLocation: mongoose.model('LiveLocation', liveLocationSchema),
  Geofence: mongoose.model('Geofence', geofenceSchema),
  RouteHistory: mongoose.model('RouteHistory', routeHistorySchema),
  GeofenceAlert: mongoose.model('GeofenceAlert', geofenceAlertSchema)
};
