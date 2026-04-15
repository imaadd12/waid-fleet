const asyncHandler = require("express-async-handler");
const Driver = require("../models/driverModel");
const Trip = require("../models/tripModel");
const Location = require("../models/locationModel");
const AuditLog = require("../models/auditLogModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const Joi = require("joi");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer configuration for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'), false);
    }
  }
});

// Validation schemas
const driverRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  age: Joi.number().min(18).max(70).required(),
  experience: Joi.number().min(0).max(50).required(),
  aadharNumber: Joi.string().pattern(/^\d{12}$/).required(),
  panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
  licenseNumber: Joi.string().min(10).max(20).required(),
  licenseExpiry: Joi.date().greater('now').required(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pincode: Joi.string().pattern(/^\d{6}$/).required()
  }).required(),
  emergencyContact: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    relationship: Joi.string().required()
  }).required(),
  rentType: Joi.string().valid('weekly', 'monthly').default('weekly'),
  weeklyRent: Joi.number().min(0).default(0),
  monthlyRent: Joi.number().min(0).default(0),
  profilePhoto: Joi.string().optional(),
  maritalStatus: Joi.string().valid('single', 'married', 'divorced', 'widowed').default('single')
});

// Upload file to Cloudinary
const uploadToCloudinary = (buffer, folder, filename) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: filename,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    stream.end(buffer);
  });
};

// @desc    Register a new driver
// @route   POST /api/drivers/register
// @access  Private (Admin only)
const registerDriver = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      age,
      experience,
      aadharNumber,
      panNumber,
      licenseNumber,
      licenseExpiry,
      address,
      emergencyContact,
      rentType,
      weeklyRent,
      monthlyRent,
      maritalStatus
    } = req.body;

    // Validate input data
    const { error } = driverRegistrationSchema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }

    // Check if driver already exists
    const driverExists = await Driver.findOne({
      $or: [{ email }, { phone }, { aadharNumber }]
    });

    if (driverExists) {
      res.status(400);
      throw new Error("Driver already exists with this email, phone, or Aadhar number");
    }

    // Check if files are uploaded
    if (!req.files || !req.files.aadharCard || !req.files.drivingLicense) {
      res.status(400);
      throw new Error("Aadhar card and driving license are required");
    }

    // Upload files to Cloudinary
    const uploadPromises = [];

    // Upload Aadhar card
    if (req.files.aadharCard) {
      uploadPromises.push(
        uploadToCloudinary(
          req.files.aadharCard[0].buffer,
          'drivers/aadhar',
          `${phone}_aadhar_${Date.now()}`
        ).then(res => ({ field: 'aadharCard', url: res.secure_url }))
      );
    }

    // Upload Driving license
    if (req.files.drivingLicense) {
      uploadPromises.push(
        uploadToCloudinary(
          req.files.drivingLicense[0].buffer,
          'drivers/license',
          `${phone}_license_${Date.now()}`
        ).then(res => ({ field: 'drivingLicense', url: res.secure_url }))
      );
    }

    // Upload PAN card
    if (req.files.panCard) {
      uploadPromises.push(
        uploadToCloudinary(
          req.files.panCard[0].buffer,
          'drivers/pan',
          `${phone}_pan_${Date.now()}`
        ).then(res => ({ field: 'panCard', url: res.secure_url }))
      );
    }

    // Upload Profile Photo
    if (req.files.profilePhoto) {
      uploadPromises.push(
        uploadToCloudinary(
          req.files.profilePhoto[0].buffer,
          'drivers/profile',
          `${phone}_profile_${Date.now()}`
        ).then(res => ({ field: 'profilePhoto', url: res.secure_url }))
      );
    }

    // Upload additional documents
    const additionalDocs = [];
    if (req.files.documents) {
      req.files.documents.forEach((file, index) => {
        uploadPromises.push(
          uploadToCloudinary(
            file.buffer,
            'drivers/documents',
            `${phone}_doc_${index + 1}_${Date.now()}`
          )
        );
      });
    }

    // Wait for all uploads to complete
    const uploadResults = await Promise.all(uploadPromises);
    
    // Map URLs back to fields
    const urls = {};
    uploadResults.forEach(res => {
      if (res.field) urls[res.field] = res.url;
    });

    // Extract additional documents separately if needed, or handle them consistently
    const documentUrls = [];
    if (req.files.documents) {
      // Additional docs start after the fixed ones
      const docResults = uploadResults.filter(r => !r.field);
      docResults.forEach(r => documentUrls.push(r.secure_url));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create driver
    const driver = await Driver.create({
      name,
      phone,
      email,
      password: hashedPassword,
      age: parseInt(age),
      experience: parseInt(experience),
      aadharCard: urls.aadharCard,
      drivingLicense: urls.drivingLicense,
      panCard: urls.panCard,
      profilePhoto: urls.profilePhoto,
      documents: documentUrls,
      aadharNumber,
      panNumber,
      licenseNumber,
      licenseExpiry: new Date(licenseExpiry),
      address: typeof address === 'string' ? JSON.parse(address) : address,
      emergencyContact: typeof emergencyContact === 'string' ? JSON.parse(emergencyContact) : emergencyContact,
      rentType,
      weeklyRent: parseFloat(weeklyRent) || 0,
      monthlyRent: parseFloat(monthlyRent) || 0,
      maritalStatus,
      verificationStatus: 'pending'
    });

    if (driver) {
      // 📝 Create Audit Log
      await AuditLog.create({
        actionType: 'create',
        entityType: 'Driver',
        entityId: driver._id,
        entityName: driver.name,
        performedBy: req.user._id,
        performedByName: req.user.name,
        performedByRole: req.user.role,
        module: 'drivers',
        description: `New driver registered: ${driver.name} (${driver.phone})`
      });

      res.status(201).json({
        success: true,
        message: "Driver registered successfully",
        data: {
          _id: driver._id,
          name: driver.name,
          phone: driver.phone,
          email: driver.email,
          age: driver.age,
          experience: driver.experience,
          verificationStatus: driver.verificationStatus,
          createdAt: driver.createdAt
        }
      });
    } else {
      res.status(400);
      throw new Error("Invalid driver data");
    }

  } catch (error) {
    console.error("Driver registration error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during driver registration"
    });
  }
});

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Private (Admin only)
const getDrivers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status; // active, inactive, pending, verified, rejected
  const search = req.query.search; // search by name, phone, or email

  let query = {};

  // Filter by status
  if (status) {
    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;
    else if (['pending', 'verified', 'rejected'].includes(status)) {
      query.verificationStatus = status;
    }
  }

  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const drivers = await Driver.find(query)
    .select('-password -refreshToken')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Driver.countDocuments(query);

  // Fetch real-time location for on-duty drivers
  const driversWithLocation = await Promise.all(drivers.map(async (d) => {
    if (d.onDuty) {
      const lastLoc = await Location.findOne({ driverId: d._id }).sort({ createdAt: -1 });
      if (lastLoc) {
        return { 
          ...d.toObject(), 
          currentLocation: { 
            lat: lastLoc.latitude, 
            lng: lastLoc.longitude, 
            address: lastLoc.address || "Active Signal" 
          } 
        };
      }
    }
    return d.toObject();
  }));

  res.json({
    success: true,
    data: driversWithLocation,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalDrivers: total,
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  });
});

// @desc    Get active drivers for Live Map
// @route   GET /api/drivers/active
// @access  Private (Admin only)
const getActiveDrivers = asyncHandler(async (req, res) => {
  const drivers = await Driver.find({ onDuty: true })
    .select('name phone currentLocation onDuty')
    .sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: drivers
  });
});

// @desc    Get driver by ID
// @route   GET /api/drivers/:id
// @access  Private
const getDriverById = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id).select('-password -refreshToken');

  if (driver) {
    res.json({
      success: true,
      data: driver
    });
  } else {
    res.status(404);
    throw new Error("Driver not found");
  }
});

// @desc    Update driver
// @route   PUT /api/drivers/:id
// @access  Private (Admin only)
const updateDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id);

  if (!driver) {
    res.status(404);
    throw new Error("Driver not found");
  }

  const allowedUpdates = [
    'name', 'phone', 'email', 'age', 'experience',
    'address', 'emergencyContact', 'rentType', 'weeklyRent', 'monthlyRent',
    'isActive', 'verificationStatus', 'onDuty', 'panNumber'
  ];

  const updates = {};
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      if (['address', 'emergencyContact'].includes(field)) {
        updates[field] = JSON.parse(req.body[field]);
      } else {
        updates[field] = req.body[field];
      }
    }
  });

  // Handle file uploads for document updates
  if (req.files) {
    const uploadPromises = [];

    if (req.files.aadharCard) {
      uploadPromises.push(
        uploadToCloudinary(
          req.files.aadharCard[0].buffer,
          'drivers/aadhar',
          `${driver.phone}_aadhar_update_${Date.now()}`
        ).then(result => ({ field: 'aadharCard', url: result.secure_url }))
      );
    }

    if (req.files.drivingLicense) {
      uploadPromises.push(
        uploadToCloudinary(
          req.files.drivingLicense[0].buffer,
          'drivers/license',
          `${driver.phone}_license_update_${Date.now()}`
        ).then(result => ({ field: 'drivingLicense', url: result.secure_url }))
      );
    }

    if (req.files.panCard) {
      uploadPromises.push(
        uploadToCloudinary(
          req.files.panCard[0].buffer,
          'drivers/pan',
          `${driver.phone}_pan_update_${Date.now()}`
        ).then(result => ({ field: 'panCard', url: result.secure_url }))
      );
    }

    if (req.files.documents) {
      const docPromises = req.files.documents.map((file, index) =>
        uploadToCloudinary(
          file.buffer,
          'drivers/documents',
          `${driver.phone}_doc_update_${index + 1}_${Date.now()}`
        ).then(result => result.secure_url)
      );
      const docUrls = await Promise.all(docPromises);
      updates.documents = [...(driver.documents || []), ...docUrls];
    }

    const uploadResults = await Promise.all(uploadPromises);
    uploadResults.forEach(result => {
      updates[result.field] = result.url;
    });
  }

  const updatedDriver = await Driver.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true }
  ).select('-password -refreshToken');

  res.json({
    success: true,
    message: "Driver updated successfully",
    data: updatedDriver
  });
});

// @desc    Delete driver
// @route   DELETE /api/drivers/:id
// @access  Private (Admin only)
const deleteDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id);

  if (!driver) {
    res.status(404);
    throw new Error("Driver not found");
  }

  await Driver.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "Driver deleted successfully"
  });
});

// @desc    Verify driver documents
// @route   PUT /api/drivers/:id/verify
// @access  Private (Admin only)
const verifyDriver = asyncHandler(async (req, res) => {
  const { status, comments } = req.body;

  if (!['verified', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error("Invalid verification status");
  }

  const driver = await Driver.findByIdAndUpdate(
    req.params.id,
    {
      verificationStatus: status,
      isVerified: status === 'verified',
      verificationComments: comments,
      verifiedAt: status === 'verified' ? new Date() : null
    },
    { new: true }
  ).select('-password -refreshToken');

  if (!driver) {
    res.status(404);
    throw new Error("Driver not found");
  }

  res.json({
    success: true,
    message: `Driver ${status} successfully`,
    data: driver
  });
});

// @desc    Get driver performance
// @route   GET /api/drivers/:id/performance
// @access  Private
const getDriverPerformance = asyncHandler(async (req, res) => {
  const driverId = req.params.id;

  // Validate driver ID
  if (!driverId || !driverId.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400);
    throw new Error('Invalid driver ID');
  }

  // Check if driver exists
  const driver = await Driver.findById(driverId);
  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }

  // Get performance data from Performance model
  const Performance = require('../models/performanceModel');
  const performanceData = await Performance.findOne({ driverId: driverId }).populate('driverId', 'name phone email');
  
  if (!performanceData) {
    // Return default performance data if no record exists yet
    return res.json({
      driverId: driverId,
      totalTrips: 0,
      avgRating: 0,
      ratingCount: 0,
      safetyScore: 100,
      level: 'bronze',
      completionRate: 100,
      cancellationRate: 0,
      totalEarnings: 0
    });
  }
  
  res.json(performanceData);
});


// @desc    Bulk register multiple drivers
// @route   POST /api/drivers/bulk-register
// @access  Private (Admin only)
async function bulkRegisterDrivers(req, res) {
  const { drivers } = req.body;

  if (!drivers || !Array.isArray(drivers)) {
    return res.status(400).json({ success: false, message: "Please provide an array of drivers" });
  }

  const results = {
    success: [],
    failed: []
  };

  for (const driverData of drivers) {
    try {
      // Basic validation for bulk
      if (!driverData.name || !driverData.phone || !driverData.email || !driverData.password) {
        results.failed.push({ driver: driverData.name || driverData.phone || 'Unknown', reason: "Missing required fields" });
        continue;
      }

      // Check if driver already exists
      const driverExists = await Driver.findOne({
        $or: [{ email: driverData.email }, { phone: driverData.phone }]
      });

      if (driverExists) {
        results.failed.push({ driver: driverData.name, reason: "Email or phone already exists" });
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(driverData.password, salt);

      // Create driver with minimal data (KYC can be updated later)
      const driver = await Driver.create({
        ...driverData,
        password: hashedPassword,
        verificationStatus: 'pending',
        isVerified: false
      });

      results.success.push({ id: driver._id, name: driver.name });
    } catch (error) {
      results.failed.push({ driver: driverData.name || 'Unknown', reason: error.message });
    }
  }

  res.json({
    success: true,
    message: `Bulk registration completed: ${results.success.length} succeeded, ${results.failed.length} failed`,
    data: results
  });
}

// @desc    Verify or Update KYC document status
// @route   PUT /api/drivers/:id/kyc-status
// @access  Private (Admin)
async function verifyDocuments(req, res) {
  const { status, comments, documentType } = req.body;
  const driver = await Driver.findById(req.params.id);
  if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

  driver.verificationStatus = status;
  if (comments) driver.verificationComments = comments;
  
  await driver.save();
  res.json({ success: true, message: `KYC ${status} for Pilot ${driver.name}`, data: driver });
}

// @desc    Dispatch safety alert to driver (Fleet Guardian)
// @route   POST /api/drivers/:id/safety-alert
// @access  Private (Admin)
async function sendSafetyAlert(req, res) {
  const { message, severity = 'info' } = req.body;
  const driver = await Driver.findById(req.params.id);
  if (!driver) return res.status(404).json({ success: false, message: "Driver not found" });

  const Notification = require('../models/notificationModel');
  await Notification.create({
    recipient: driver._id,
    recipientModel: 'Driver',
    title: 'Fleet Guardian Security Alert',
    message,
    type: 'safety',
    priority: severity === 'critical' ? 'high' : 'medium'
  });

  res.json({ success: true, message: "Safety alert dispatched to Pilot cockpit" });
}

module.exports = {
  registerDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  verifyDriver,
  upload,
  getDriverPerformance,
  getActiveDrivers,
  searchDrivers,
  getMyPerformance,
  bulkRegisterDrivers,
  verifyDocuments,
  sendSafetyAlert
};

// @desc    Search drivers by name, serial or phone (autocomplete)
// @route   GET /api/drivers/search?q=
// @access  Private (Admin)
async function searchDrivers(req, res) {
  const { q = '' } = req.query;
  if (!q.trim()) return res.json({ success: true, data: [] });
  const regex = new RegExp(q.trim(), 'i');
  const drivers = await Driver.find({
    $or: [
      { name: regex },
      { driverSerial: regex },
      { phone: regex },
      { email: regex }
    ]
  }).select('name phone driverSerial weeklyRent rentType verificationStatus onDuty isActive').limit(15);
  res.json({ success: true, data: drivers });
}

// @desc    Get performance stats for logged-in driver
// @route   GET /api/drivers/me/performance
// @access  Private (Driver)
async function getMyPerformance(req, res) {
  const driverId = req.user.id;

  const [total, completed, cancelled, lastWeekCompleted] = await Promise.all([
    Trip.countDocuments({ driverId }),
    Trip.countDocuments({ driverId, status: 'completed' }),
    Trip.countDocuments({ driverId, status: 'cancelled' }),
    Trip.countDocuments({
      driverId, status: 'completed',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
  ]);

  const totalFareResult = await Trip.aggregate([
    { $match: { driverId: require('mongoose').Types.ObjectId.createFromHexString(driverId), status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$fare' }, avgFare: { $avg: '$fare' }, avgDistance: { $avg: '$distance' } } }
  ]);
  const fareStats = totalFareResult[0] || { total: 0, avgFare: 0, avgDistance: 0 };

  // Last 7 days breakdown for mini chart
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dailyTrips = await Trip.aggregate([
    { $match: { driverId: require('mongoose').Types.ObjectId.createFromHexString(driverId), status: 'completed', createdAt: { $gte: sevenDaysAgo } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      count: { $sum: 1 },
      earnings: { $sum: '$fare' }
    }},
    { $sort: { _id: 1 } }
  ]);

  const acceptanceRate = total > 0 ? Math.round((completed / total) * 100) : 100;
  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

  res.json({
    success: true,
    data: {
      totalTrips: total,
      completedTrips: completed,
      cancelledTrips: cancelled,
      lastWeekTrips: lastWeekCompleted,
      grossEarnings: fareStats.total,
      avgFare: fareStats.avgFare,
      avgDistance: fareStats.avgDistance,
      acceptanceRate,
      cancellationRate,
      dailyBreakdown: dailyTrips
    }
  });
}