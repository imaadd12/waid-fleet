const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      enum: [
        "create",
        "read",
        "update",
        "delete",
        "login",
        "logout",
        "approve",
        "reject",
        "export",
        "import",
        "download",
        "upload",
        "suspend",
        "activate"
      ],
      required: true
    },
    entityType: {
      type: String,
      enum: [
        "Driver",
        "Vehicle",
        "Bill",
        "Payment",
        "Ticket",
        "AdminUser",
        "Settings",
        "Notification",
        "Report"
      ],
      required: true
    },
    entityId: String,
    entityName: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true
    },
    performedByName: String,
    performedByRole: String,
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed
    },
    description: String,
    ipAddress: String,
    userAgent: String,
    status: {
      type: String,
      enum: ["success", "failure"],
      default: "success"
    },
    errorMessage: String,
    module: {
      type: String,
      enum: [
        "drivers",
        "vehicles",
        "billing",
        "payments",
        "support",
        "admin",
        "reports",
        "settings"
      ]
    },
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info"
    },
    affectedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver"
      }
    ],
    tags: [String],
    isSystemGenerated: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    indexes: [
      { performedBy: 1, createdAt: -1 },
      { entityType: 1, createdAt: -1 },
      { actionType: 1 },
      { severity: 1 },
      { createdAt: -1 },
      { module: 1 }
    ]
  }
);

// Auto-populate user info at query time
auditLogSchema.pre(/^find/, function () {
  if (this.options._recursed) {
    return;
  }
  this.options._recursed = true;
  this.populate("performedBy", "name email role");
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
