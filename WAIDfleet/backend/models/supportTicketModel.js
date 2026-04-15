const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      default: () => `TKT-${Date.now()}`
    },
    category: {
      type: String,
      enum: ["driver_issue", "payment", "technical", "general", "urgent"],
      default: "general"
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium"
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "waiting", "resolved", "closed", "reopened"],
      default: "open"
    },
    subject: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    reportedBy: {
      type: String,
      enum: ["driver", "admin"],
      required: true
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver"
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser"
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: Date
      }
    ],
    messages: [
      {
        authorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "AdminUser"
        },
        authorType: {
          type: String,
          enum: ["admin", "driver"],
          default: "admin"
        },
        message: String,
        attachments: [String],
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    resolution: {
      description: String,
      resolvedAt: Date,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AdminUser"
      }
    },
    customerSatisfaction: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      feedback: String,
      ratedAt: Date
    },
    slaData: {
      firstResponseAt: Date,
      resolutionTargetTime: Date,
      actualResolutionTime: Date,
      slaBreached: Boolean
    },
    tags: [String],
    relatedTickets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SupportTicket"
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
      { ticketNumber: 1 },
      { status: 1 },
      { priority: 1 },
      { assignedTo: 1 },
      { driverId: 1 },
      { createdAt: -1 }
    ]
  }
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
