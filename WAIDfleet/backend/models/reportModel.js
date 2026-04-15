const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reportName: {
      type: String,
      required: true
    },
    reportType: {
      type: String,
      enum: ["daily", "weekly", "monthly", "custom", "automated"],
      default: "custom"
    },
    reportCategory: {
      type: String,
      enum: ["financial", "operational", "driver_performance", "vehicle", "compliance"],
      required: true
    },
    reportDetails: {
      startDate: Date,
      endDate: Date,
      generatedDate: {
        type: Date,
        default: Date.now
      },
      generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AdminUser"
      },
      format: {
        type: String,
        enum: ["pdf", "excel", "csv", "json"],
        default: "pdf"
      },
      fileUrl: String,
      fileSize: Number
    },
    dataPoints: {
      // Financial Reports
      totalRevenue: Number,
      totalEarnings: Number,
      totalDeductions: Number,
      totalTaxes: Number,
      totalBonuses: Number,
      netProfit: Number,
      
      // Operational Reports
      totalTrips: Number,
      completedTrips: Number,
      cancelledTrips: Number,
      totalDistance: Number,
      averageRating: Number,
      
      // Driver Performance
      topPerformers: [
        {
          driverId: mongoose.Schema.Types.ObjectId,
          driverName: String,
          rating: Number,
          earnings: Number,
          trips: Number
        }
      ],
      bottomPerformers: [
        {
          driverId: mongoose.Schema.Types.ObjectId,
          driverName: String,
          rating: Number,
          earnings: Number,
          trips: Number
        }
      ],
      
      // Vehicle Reports
      fleetUtilization: Number,
      vehicleDowntime: Number,
      maintenanceCost: Number,
      
      // Compliance
      verifiedDrivers: Number,
      suspendedDrivers: Number,
      documentsVerified: Number,
      pendingVerifications: Number
    },
    metrics: {
      averageEarningsPerDriver: Number,
      averageEarningsPerTrip: Number,
      averageRating: Number,
      completionRate: Number,
      customerSatisfaction: Number
    },
    filters: {
      driverId: [mongoose.Schema.Types.ObjectId],
      vehicleId: [mongoose.Schema.Types.ObjectId],
      region: [String],
      status: [String],
      category: [String]
    },
    visualizations: [
      {
        type: String,
        enum: ["line_chart", "bar_chart", "pie_chart", "table", "heatmap"]
      }
    ],
    summary: String,
    insights: [String],
    recommendations: [String],
    isScheduled: {
      type: Boolean,
      default: false
    },
    schedule: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "quarterly"]
      },
      dayOfWeek: {
        type: Number,
        enum: [0, 1, 2, 3, 4, 5, 6]
      },
      dayOfMonth: Number,
      time: String,
      recipients: [String],
      lastSentAt: Date,
      nextSendAt: Date
    },
    status: {
      type: String,
      enum: ["draft", "generated", "sent", "archived"],
      default: "draft"
    },
    accessLevel: {
      type: String,
      enum: ["private", "team", "public"],
      default: "private"
    },
    accessibleBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AdminUser"
      }
    ],
    tags: [String],
    notes: String
  },
  {
    timestamps: true,
    indexes: [
      { reportType: 1, createdAt: -1 },
      { reportCategory: 1 },
      { "reportDetails.generatedBy": 1 },
      { isScheduled: 1 },
      { status: 1 }
    ]
  }
);

module.exports = mongoose.model("Report", reportSchema);
