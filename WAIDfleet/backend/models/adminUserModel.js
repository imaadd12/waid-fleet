const mongoose = require("mongoose");

const adminUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    phone: String,
    role: {
      type: String,
      enum: ["super_admin", "sub_admin", "finance", "operations", "support", "manager"],
      default: "sub_admin"
    },
    permissions: [
      {
        type: String,
        enum: [
          // Dashboard
          "dashboard",
          // Driver Portal Sections
          "view_drivers", "manage_drivers",
          "view_vehicles", "manage_vehicles",
          "view_incidents", "manage_incidents",
          "view_earnings", "manage_earnings",
          "view_payroll", "manage_payroll",
          "view_reports", "export_reports",
          "view_live_map",
          "view_maintenance", "manage_maintenance",
          "view_dispatch", "manage_dispatch",
          "view_compliance",
          "access_control",
          "view_financials",
          "manage_financials",
          // Sub-admin management (super_admin only)
          "manage_subadmins",
          // Legacy
          "users_manage", "tickets_manage", "audit_logs",
          "reports_view", "billing_manage", "drivers_manage",
          "vehicles_manage", "settings_manage"
        ]
      }
    ],
    isSubAdmin: {
      type: Boolean,
      default: false
    },
    accessStartsAt: {
      type: Date,
      default: null
    },
    accessExpiresAt: {
      type: Date,
      default: null
    },
    isTemporary: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: String,
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    sessionTimeout: {
      type: Number,
      default: 3600 // 1 hour
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: Date,
    lastLoginIP: String,
    loginAttempts: {
      type: Number,
      default: 0
    },
    isLocked: {
      type: Boolean,
      default: false
    },
    lockedUntil: Date,
    departmentAssignment: String,
    designation: String,
    reportingTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser"
    },
    activityLog: [
      {
        action: String,
        details: String,
        timestamp: {
          type: Date,
          default: Date.now
        },
        ipAddress: String,
        userAgent: String
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser"
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser"
    }
  },
  {
    timestamps: true,
    indexes: [
      { email: 1 },
      { role: 1 },
      { isActive: 1 },
      { lastLogin: -1 }
    ]
  }
);

// Hide password by default
adminUserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("AdminUser", adminUserSchema);
