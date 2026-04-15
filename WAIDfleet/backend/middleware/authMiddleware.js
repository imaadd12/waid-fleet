const jwt = require("jsonwebtoken");
const SystemConfig = require("../models/systemConfigModel");
const AdminUser = require("../models/adminUserModel");
const User = require("../models/userModel");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      let user = await AdminUser.findById(decoded.id).select("-password");
      
      if (!user) {
        user = await User.findById(decoded.id).select("-password");
      }

      if (!user) {
        const Driver = require("../models/driverModel");
        user = await Driver.findById(decoded.id).select("-password");
        if (user) {
          user = user.toObject();
          user.role = "driver";
          user.isAdminModel = false;
        }
      }

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: "🔒 Your account has been suspended. Please contact the Super Admin." });
      }

      // ⏳ Check Temporary Access Window
      const now = new Date();
      if (user.isTemporary) {
        if (user.accessStartsAt && now < user.accessStartsAt) {
          return res.status(403).json({ message: `🚫 Your scheduled access starts at ${user.accessStartsAt.toLocaleString()}` });
        }
        if (user.accessExpiresAt && now > user.accessExpiresAt) {
          return res.status(403).json({ message: "⌛ Your temporary access has expired. Please contact the Administrator." });
        }
      }

      req.user = user;
      next();
    } catch (error) {
      // Only treat JWT-specific errors as 401; DB or unexpected errors become 500
      if (
        error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError" ||
        error.name === "NotBeforeError"
      ) {
        return res.status(401).json({ message: "Not authorized, token failed" });
      }
      return res.status(500).json({ message: "Authentication service error" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

const adminOnly = (req, res, next) => {
  const adminRoles = ["admin", "super_admin", "sub_admin", "finance", "operations", "support", "manager", "superadmin"];
  if (req.user && (adminRoles.includes(req.user.role) || req.user.isAdmin || req.user.isAdminModel)) {
    next();
  } else {
    return res.status(403).json({ success: false, message: "Only administrators can access this resource." });
  }
};

const checkPermission = (permission) => {
  return async (req, res, next) => {
    // Super admins have all permissions
    if (req.user && (req.user.role === "super_admin" || req.user.role === "superadmin")) {
      return next();
    }

    try {
      const config = await SystemConfig.findOne({ key: "global_settings" });
      if (config && config.adminAbsent) {
        const RESTRICTED = ["manage_financials", "manage_subadmins", "delete_driver", "delete_vehicle", "manage_drivers"];
        if (RESTRICTED.includes(permission)) {
          return res.status(403).json({ 
            success: false, 
            message: "⚠️ Admin Absence Mode: This action is restricted while the primary Admin is away." 
          });
        }
      }
    } catch (e) {
      console.error("Absence Check Error:", e);
    }

    if (req.user && req.user.permissions && req.user.permissions.includes(permission)) {
      return next();
    }
    
    return res.status(403).json({ 
      success: false, 
      message: `Access denied. You do not have the required permission: ${permission}` 
    });
  };
};

module.exports = { protect, adminOnly, checkPermission };