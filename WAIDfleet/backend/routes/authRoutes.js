const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AdminUser = require("../models/adminUserModel");
const { protect } = require("../middleware/authMiddleware");
const Driver = require("../models/driverModel");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication APIs
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const emailLower = email.toLowerCase();

    const userExists = await User.findOne({ email: emailLower });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: emailLower,
      password: hashedPassword,
      role,
      phone,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user (Admin or Driver)
 *     tags: [Auth]
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password, portal } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const emailLower = email.toLowerCase();

    let user = null;
    let isDriverModel = false;
    let isAdminModel = false;

    // Targeted Lookup Priority
    if (portal === 'admin') {
      user = await AdminUser.findOne({ email: emailLower });
      isAdminModel = !!user;
      if (!user) {
        user = await User.findOne({ email: emailLower });
        // Even if found in User, if requested admin portal, check if it has admin role
        if (user && !['admin', 'superadmin', 'super_admin'].includes(user.role)) {
           user = null; // Block as the user model entry isn't an admin
        }
      }
    } else if (portal === 'driver') {
      user = await Driver.findOne({ email: emailLower });
      isDriverModel = !!user;
    } else {
      // General/Legacy lookup
      user = await User.findOne({ email: emailLower });
      if (!user) {
        user = await AdminUser.findOne({ email: emailLower });
        isAdminModel = !!user;
      }
      if (!user) {
        user = await Driver.findOne({ email: emailLower });
        isDriverModel = !!user;
      }
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Role detection
    let role = user.role;
    if (isDriverModel) role = "driver";
    if (isAdminModel && !role) role = "admin"; // Fallback for admin users

    const token = jwt.sign(
      { id: user._id, role, isDriverModel, isAdminModel, permissions: user.permissions || [] },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get logged-in user profile
 *     tags: [Auth]
 */
router.get("/profile", protect, async (req, res) => {
  try {
    let user = await User.findById(req.user.id).select("-password");

    if (!user) {
      user = await Driver.findById(req.user.id).select("-password");
      if (user) {
        user = user.toObject();
        user.role = "driver";
      }
    }

    if (!user) {
      user = await AdminUser.findById(req.user.id).select("-password");
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Auth]
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }

    const emailLower = email.toLowerCase();

    // Check all models
    let user = await User.findOne({ email: emailLower });
    let modelType = "User";

    if (!user) {
      user = await AdminUser.findOne({ email: emailLower });
      modelType = "AdminUser";
    }

    if (!user) {
      user = await Driver.findOne({ email: emailLower });
      modelType = "Driver";
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found with this email",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful. You can now login with your new credentials.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;