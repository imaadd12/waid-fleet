const express = require('express');
const asyncHandler = require('express-async-handler');
const { LiveLocation, Geofence, RouteHistory, GeofenceAlert } = require('../models/locationModel');
const { Driver } = require('../models/driverModel');

// @desc    Save driver's live location
// @route   POST /api/locations/update
// @access  Private
const updateLocation = asyncHandler(async (req, res) => {
  const { driverId, tripId, latitude, longitude, accuracy, speed, heading, altitude } = req.body;

  // Validate coordinates
  if (!latitude || !longitude || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ message: 'Invalid coordinates' });
  }

  try {
    // Update or create live location
    const liveLocation = await LiveLocation.findOneAndUpdate(
      { driverId },
      {
        driverId,
        tripId,
        latitude,
        longitude,
        accuracy: accuracy || 0,
        speed: speed || 0,
        heading: heading || 0,
        altitude,
        isActive: true,
        timestamp: new Date()
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: liveLocation,
      message: 'Location updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get driver's current location
// @route   GET /api/locations/current/:driverId
// @access  Private
const getCurrentLocation = asyncHandler(async (req, res) => {
  try {
    const location = await LiveLocation.findOne({ driverId: req.params.driverId });
    
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.status(200).json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get route history for a trip
// @route   GET /api/locations/route/:tripId
// @access  Private
const getRouteHistory = asyncHandler(async (req, res) => {
  try {
    const route = await RouteHistory.findOne({ tripId: req.params.tripId })
      .populate('driverId', 'firstName lastName phoneNumber');

    if (!route) {
      return res.status(404).json({ message: 'Route history not found' });
    }

    res.status(200).json({ success: true, data: route });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a geofence
// @route   POST /api/geofences
// @access  Private (Admin only)
const createGeofence = asyncHandler(async (req, res) => {
  const { name, latitude, longitude, radius, type, alertType } = req.body;

  if (!name || !latitude || !longitude || !radius || !type) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const geofence = await Geofence.create({
      name,
      latitude,
      longitude,
      radius,
      type,
      alertType,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: geofence,
      message: 'Geofence created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all geofences
// @route   GET /api/geofences
// @access  Private
const getGeofences = asyncHandler(async (req, res) => {
  try {
    const { type, isActive } = req.query;
    let filter = {};

    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const geofences = await Geofence.find(filter).sort('-createdAt');

    res.status(200).json({
      success: true,
      data: geofences,
      count: geofences.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a geofence
// @route   PUT /api/geofences/:id
// @access  Private (Admin only)
const updateGeofence = asyncHandler(async (req, res) => {
  try {
    const geofence = await Geofence.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!geofence) {
      return res.status(404).json({ message: 'Geofence not found' });
    }

    res.status(200).json({
      success: true,
      data: geofence,
      message: 'Geofence updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a geofence
// @route   DELETE /api/geofences/:id
// @access  Private (Admin only)
const deleteGeofence = asyncHandler(async (req, res) => {
  try {
    const geofence = await Geofence.findByIdAndDelete(req.params.id);

    if (!geofence) {
      return res.status(404).json({ message: 'Geofence not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Geofence deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Check if driver is within geofence
// @route   POST /api/geofences/check
// @access  Private
const checkGeofence = asyncHandler(async (req, res) => {
  const { driverId, latitude, longitude } = req.body;

  try {
    const geofences = await Geofence.find({ isActive: true });
    const breaches = [];

    geofences.forEach(geofence => {
      const distance = calculateDistance(latitude, longitude, geofence.latitude, geofence.longitude);
      
      if (distance <= geofence.radius / 1000) {
        breaches.push({
          geofenceId: geofence._id,
          geofenceName: geofence.name,
          type: geofence.type,
          distance
        });
      }
    });

    // Log geofence alerts
    for (const breach of breaches) {
      const existingAlert = await GeofenceAlert.findOne({
        geofenceId: breach.geofenceId,
        driverId,
        alertType: 'enter',
        createdAt: { $gt: new Date(Date.now() - 5 * 60000) } // Last 5 minutes
      });

      if (!existingAlert) {
        await GeofenceAlert.create({
          geofenceId: breach.geofenceId,
          driverId,
          alertType: 'enter',
          location: { latitude, longitude },
          severity: geofences.find(g => g._id.toString() === breach.geofenceId.toString()).type === 'restricted' ? 'critical' : 'info'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: { breaches, count: breaches.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get geofence alerts
// @route   GET /api/geofences/alerts
// @access  Private
const getGeofenceAlerts = asyncHandler(async (req, res) => {
  try {
    const { driverId, limit = 50, skip = 0 } = req.query;
    let filter = {};

    if (driverId) filter.driverId = driverId;

    const alerts = await GeofenceAlert.find(filter)
      .populate('geofenceId', 'name type')
      .sort('-timestamp')
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await GeofenceAlert.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: alerts,
      total,
      count: alerts.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get location analytics
// @route   GET /api/locations/analytics
// @access  Private (Admin only)
const getLocationAnalytics = asyncHandler(async (req, res) => {
  try {
    const { driverId, startDate, endDate } = req.query;
    let filter = {};

    if (driverId) filter.driverId = driverId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const routes = await RouteHistory.find(filter);
    const activeDrivers = await LiveLocation.countDocuments({ isActive: true });
    
    const totalDistance = routes.reduce((sum, route) => sum + (route.distance || 0), 0);
    const avgEfficiency = routes.length > 0 
      ? routes.reduce((sum, route) => sum + (route.efficiency || 0), 0) / routes.length 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalRoutes: routes.length,
        activeDrivers,
        totalDistance,
        avgEfficiency: avgEfficiency.toFixed(2),
        totalViolations: routes.reduce((sum, route) => sum + (route.violations?.length || 0), 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

module.exports = {
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
};
