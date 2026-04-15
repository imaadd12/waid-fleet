const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  updateLocation,
  getCurrentLocation,
  getRouteHistory,
  createGeofence,
  getGeofences,
  updateGeofence,
  deleteGeofence,
  checkGeofence,
  getGeofenceAlerts,
  getLocationAnalytics
} = require('../controllers/locationController');

// Live Location Routes
router.post('/update', protect, updateLocation);
router.get('/current/:driverId', protect, getCurrentLocation);
router.get('/route/:tripId', protect, getRouteHistory);

// Geofence Routes
router.post('/geofence', protect, adminOnly, createGeofence);
router.get('/geofence', protect, getGeofences);
router.put('/geofence/:id', protect, adminOnly, updateGeofence);
router.delete('/geofence/:id', protect, adminOnly, deleteGeofence);
router.post('/geofence/check', protect, checkGeofence);
router.get('/geofence/alerts', protect, getGeofenceAlerts);

// Analytics
router.get('/analytics', protect, adminOnly, getLocationAnalytics);

module.exports = router;
