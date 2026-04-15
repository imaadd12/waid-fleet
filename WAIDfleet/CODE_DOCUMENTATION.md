# WAID Fleet — Complete Code Documentation

> **Project:** WAID Fleet Management System  
> **Stack:** Node.js / Express / MongoDB (backend) · React / Vite (frontend)  
> **Purpose:** End-to-end fleet management platform covering driver registration, vehicle assignment, trip lifecycle, billing, payments, notifications, real-time tracking, and admin controls.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Backend Entry Point — `server.js`](#2-backend-entry-point--serverjs)
3. [Database Connection — `config/db.js`](#3-database-connection--configdbjs)
4. [Default Seed / Init Admin — `utils/initAdmin.js`](#4-default-seed--init-admin--utilsinitadminjs)
5. [Mongoose Models](#5-mongoose-models)
   - 5.1 [User Model](#51-user-model)
   - 5.2 [AdminUser Model](#52-adminuser-model)
   - 5.3 [Driver Model](#53-driver-model)
   - 5.4 [Vehicle Model](#54-vehicle-model)
   - 5.5 [Trip Model](#55-trip-model)
   - 5.6 [Earnings Model](#56-earnings-model)
   - 5.7 [Billing Model](#57-billing-model)
   - 5.8 [Payment / Wallet / Transaction Models](#58-payment--wallet--transaction-models)
   - 5.9 [Incident Model](#59-incident-model)
   - 5.10 [Location / Geofence Models](#510-location--geofence-models)
   - 5.11 [Notification Models](#511-notification-models)
6. [Middleware](#6-middleware)
   - 6.1 [Auth Middleware](#61-auth-middleware)
   - 6.2 [Rate-Limit Middleware](#62-rate-limit-middleware)
   - 6.3 [Error Handler Middleware](#63-error-handler-middleware)
7. [Routes](#7-routes)
   - 7.1 [Auth Routes](#71-auth-routes)
   - 7.2 [Driver Routes](#72-driver-routes)
8. [Controllers](#8-controllers)
   - 8.1 [Auth Controller](#81-auth-controller)
   - 8.2 [Driver Controller (Registration)](#82-driver-controller-registration)
   - 8.3 [Vehicle Controller](#83-vehicle-controller)
   - 8.4 [Trip Controller](#84-trip-controller)
9. [Real-Time Socket — `sockets/socket.js`](#9-real-time-socket--socketssocketjs)
10. [Frontend — App Router (`App.jsx`)](#10-frontend--app-router-appjsx)
11. [Frontend — Auth Context (`context/AuthContext.jsx`)](#11-frontend--auth-context-contextauthcontextjsx)
12. [Frontend — Route Guards](#12-frontend--route-guards)
    - 12.1 [ProtectedRoute](#121-protectedroute)
    - 12.2 [AdminRoute](#122-adminroute)
13. [Frontend — Login Page](#13-frontend--login-page)
14. [API Endpoint Reference](#14-api-endpoint-reference)

---

## 1. Project Structure

```
WAIDfleet/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── driverController.js
│   │   ├── vehicleController.js
│   │   ├── tripController.js
│   │   ├── billingController.js
│   │   ├── paymentController.js
│   │   ├── analyticsController.js
│   │   └── ...
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT protect, adminOnly, checkPermission
│   │   ├── rateLimitMiddleware.js
│   │   ├── errorHandler.js
│   │   └── roleMiddleware.js
│   ├── models/
│   │   ├── userModel.js
│   │   ├── adminUserModel.js
│   │   ├── driverModel.js
│   │   ├── vehicleModel.js
│   │   ├── tripModel.js
│   │   ├── earningsModel.js
│   │   ├── billingModel.js
│   │   ├── paymentModel.js          # Wallet, Transaction, SubscriptionPlan ...
│   │   ├── incidentModel.js
│   │   ├── locationModel.js         # LiveLocation, Geofence, RouteHistory
│   │   ├── notificationModel.js
│   │   └── ...
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── driverRoutes.js
│   │   ├── vehicleRoutes.js
│   │   ├── tripRoutes.js
│   │   └── ...
│   ├── sockets/
│   │   └── socket.js                # Socket.IO real-time events
│   ├── utils/
│   │   └── initAdmin.js             # Seed default admin & driver on startup
│   └── server.js                    # Express app entry point
└── frontend/
    └── src/
        ├── App.jsx                  # React Router configuration
        ├── context/
        │   ├── AuthContext.jsx      # Auth state + login/logout helpers
        │   └── ToastContext.jsx
        ├── components/
        │   ├── ProtectedRoute.jsx
        │   ├── AdminRoute.jsx
        │   └── CommandPalette.jsx
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── Drivers.jsx
            ├── Vehicles.jsx
            ├── Trips/Dispatch.jsx
            ├── Billing.jsx
            ├── AdminPanel.jsx
            └── ...
```

---

## 2. Backend Entry Point — `server.js`

The main entry point bootstraps Express, attaches middleware, loads all route modules, initialises Socket.IO and starts the HTTP server.

```js
const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const morgan  = require("morgan");
require("dotenv").config();

const http = require("http");
const path = require("path");
const { initSocket }  = require("./sockets/socket");
const swaggerUi       = require("swagger-ui-express");
const swaggerJsDoc    = require("swagger-jsdoc");

const connectDB   = require("./config/db");
const initAdmin   = require("./utils/initAdmin");
const {
  generalLimiter, authLimiter, paymentLimiter, adminLimiter
} = require("./middleware/rateLimitMiddleware");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

// Connect DB then seed default admin if absent
connectDB()
  .then(initAdmin)
  .catch((err) => {
    console.error("❌ Startup initialization failed:", err.message);
    process.exit(1);
  });

const app    = express();
const server = http.createServer(app);

// ─── Middleware ────────────────────────────────────────────────
app.use(helmet());
app.use(morgan("combined"));
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ─── Rate limiting ─────────────────────────────────────────────
app.use("/api/auth",     authLimiter);
app.use("/api/payments", paymentLimiter);
app.use("/api/admin",    adminLimiter);
app.use(generalLimiter);

// ─── Swagger API docs ──────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: { title: "Waid Fleet API", version: "1.0.0" },
    servers: [{ url: "http://localhost:5000" }],
  },
  apis: [path.join(__dirname, "routes/*.js")],
};
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerJsDoc(swaggerOptions)));

// ─── Safe route loader (fails gracefully) ─────────────────────
const loadRoute = (routePath, routeUrl) => {
  try {
    app.use(routeUrl, require(routePath));
    console.log(`✅ Loaded: ${routeUrl}`);
  } catch (err) {
    console.error(`❌ Failed to load ${routeUrl}:`, err.message);
  }
};

// ─── Route registration ────────────────────────────────────────
loadRoute("./routes/authRoutes",         "/api/auth");
loadRoute("./routes/driverRoutes",       "/api/drivers");
loadRoute("./routes/vehicleRoutes",      "/api/vehicles");
loadRoute("./routes/earningsRoutes",     "/api/earnings");
loadRoute("./routes/paymentRoutes",      "/api/payments");
loadRoute("./routes/billingRoutes",      "/api/billing");
loadRoute("./routes/analyticsRoutes",    "/api/analytics");
loadRoute("./routes/shiftRoutes",        "/api/shifts");
loadRoute("./routes/incidentRoutes",     "/api/incidents");
loadRoute("./routes/performanceRoutes",  "/api/performance");
loadRoute("./routes/notificationRoutes", "/api/notifications");
loadRoute("./routes/adminRoutes",        "/api/admin");
loadRoute("./routes/locationRoutes",     "/api/location");
loadRoute("./routes/walletRoutes",       "/api/wallet");
loadRoute("./routes/documentRoutes",     "/api/documents");
loadRoute("./routes/tripRoutes",         "/api/trips");
loadRoute("./routes/fuelRoutes",         "/api/fuel");
loadRoute("./routes/zoneRoutes",         "/api/zones");
loadRoute("./routes/gamificationRoutes", "/api/gamification");

// ─── Health check ──────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ success: true, message: "Server is healthy" }));

// ─── Error handlers ────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Socket.IO ─────────────────────────────────────────────────
initSocket(server);

// ─── Start ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Swagger: http://localhost:${PORT}/api-docs`);
});

module.exports = app;
```

---

## 3. Database Connection — `config/db.js`

```js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully 🚀");
    console.log("Host:", conn.connection.host);
    console.log("Database Name:", conn.connection.name);
  } catch (error) {
    console.error("MongoDB connection failed ❌");
    console.error("Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

**Required environment variable:** `MONGO_URI` — MongoDB connection string.

---

## 4. Default Seed / Init Admin — `utils/initAdmin.js`

Called automatically at startup to ensure a default super-admin and a test driver always exist so the system can be accessed without running manual seed scripts.

```js
const DEFAULT_ADMIN_EMAIL    = "admin@waidfleet.com";
const DEFAULT_ADMIN_PASSWORD = "Admin@123";

const DEFAULT_DRIVER_EMAIL    = "driver@waidfleet.com";
const DEFAULT_DRIVER_PASSWORD = "Driver@123";

const ADMIN_PERMISSIONS = [
  "dashboard",
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
  "view_financials", "manage_financials",
  "manage_subadmins",
  "users_manage", "tickets_manage", "audit_logs",
  "reports_view", "billing_manage", "drivers_manage",
  "vehicles_manage", "settings_manage"
];

const initAdmin = async () => {
  // Create AdminUser record if missing
  const existingAdminUser       = await AdminUser.findOne({ email: DEFAULT_ADMIN_EMAIL });
  const existingUserWithAdminEmail = await User.findOne({ email: DEFAULT_ADMIN_EMAIL });

  if (!existingAdminUser && !existingUserWithAdminEmail) {
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, await bcrypt.genSalt(10));
    await AdminUser.create({
      name: "System Admin", email: DEFAULT_ADMIN_EMAIL,
      password: hashedPassword, role: "super_admin",
      permissions: ADMIN_PERMISSIONS, isActive: true
    });
  }

  // Also insert into legacy User model
  if (!existingUserWithAdminEmail) {
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, await bcrypt.genSalt(10));
    await User.create({
      name: "System Admin", email: DEFAULT_ADMIN_EMAIL,
      password: hashedPassword, role: "admin", isActive: true
    });
  }

  // Create default test driver
  const existingDriver = await Driver.findOne({ email: DEFAULT_DRIVER_EMAIL });
  if (!existingDriver) {
    const hashedPassword = await bcrypt.hash(DEFAULT_DRIVER_PASSWORD, await bcrypt.genSalt(10));
    await Driver.create({
      name: "Test Driver", email: DEFAULT_DRIVER_EMAIL,
      password: hashedPassword, phone: "9000000000",
      age: 30, experience: 5,
      aadharCard: "placeholder", drivingLicense: "placeholder",
      aadharNumber: "000000000000", licenseNumber: "TEST001",
      licenseExpiry: new Date("2030-12-31"),
      role: "driver", isVerified: true,
      verificationStatus: "verified", isActive: true
    });
  }
};

module.exports = initAdmin;
```

---

## 5. Mongoose Models

### 5.1 User Model

Represents general users (drivers, clients) in the legacy authentication collection.

```js
// models/userModel.js
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },    // bcrypt hash
  role:     { type: String, enum: ["admin", "client", "driver"], default: "client" },
  phone:    { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
```

---

### 5.2 AdminUser Model

Extended admin accounts with granular permissions, 2FA support, session timeout, and activity logs.

```js
// models/adminUserModel.js
const adminUserSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  phone:    String,
  role: {
    type: String,
    enum: ["super_admin", "sub_admin", "finance", "operations", "support", "manager"],
    default: "sub_admin"
  },
  permissions: [{
    type: String,
    enum: [
      "dashboard",
      "view_drivers", "manage_drivers",
      "view_vehicles", "manage_vehicles",
      "view_incidents", "manage_incidents",
      "view_earnings", "manage_earnings",
      "view_payroll", "manage_payroll",
      "view_reports", "export_reports",
      "view_live_map",
      "view_maintenance", "manage_maintenance",
      "view_dispatch", "manage_dispatch",
      "view_compliance", "access_control",
      "view_financials", "manage_financials",
      "manage_subadmins",
      "users_manage", "tickets_manage", "audit_logs",
      "reports_view", "billing_manage", "drivers_manage",
      "vehicles_manage", "settings_manage"
    ]
  }],
  isSubAdmin:         { type: Boolean, default: false },
  accessStartsAt:     { type: Date, default: null },
  accessExpiresAt:    { type: Date, default: null },
  isTemporary:        { type: Boolean, default: false },
  twoFactorSecret:    String,
  twoFactorEnabled:   { type: Boolean, default: false },
  sessionTimeout:     { type: Number, default: 3600 },  // seconds
  isActive:           { type: Boolean, default: true },
  lastLogin:          Date,
  lastLoginIP:        String,
  loginAttempts:      { type: Number, default: 0 },
  isLocked:           { type: Boolean, default: false },
  lockedUntil:        Date,
  departmentAssignment: String,
  designation:        String,
  reportingTo:        { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
  activityLog: [{
    action: String, details: String,
    timestamp: { type: Date, default: Date.now },
    ipAddress: String, userAgent: String
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AdminUser" },
}, { timestamps: true });

// Hide password from JSON output
adminUserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("AdminUser", adminUserSchema);
```

---

### 5.3 Driver Model

Core driver profile — includes personal info, documents (Cloudinary URLs), KYC verification, and rent structure.

```js
// models/driverModel.js
const driverSchema = new mongoose.Schema({
  driverSerial: { type: String, unique: true },  // auto-generated DRV-XXXX

  // Personal info
  name:         { type: String, required: true },
  phone:        { type: String, required: true, unique: true },
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },
  age:          { type: Number, required: true, min: 18, max: 70 },
  experience:   { type: Number, required: true, min: 0, max: 50 },
  maritalStatus:{ type: String, enum: ["single","married","divorced","widowed"], default: "single" },

  // Document uploads (Cloudinary URLs)
  aadharCard:     { type: String, required: true },
  drivingLicense: { type: String, required: true },
  panCard:        { type: String },
  profilePhoto:   { type: String },
  documents:      [{ type: String }],

  // Document numbers
  aadharNumber:  { type: String, required: true },
  panNumber:     { type: String },
  licenseNumber: { type: String, required: true },
  licenseExpiry: { type: Date,   required: true },

  // Address & emergency contact
  address: { street: String, city: String, state: String, pincode: String },
  emergencyContact: { name: String, phone: String, relationship: String },

  // Role & rent
  role:        { type: String, enum: ["admin","driver"], default: "driver" },
  rentType:    { type: String, enum: ["weekly","monthly"], default: "weekly" },
  weeklyRent:  { type: Number, default: 0 },
  monthlyRent: { type: Number, default: 0 },
  subscription:{ type: Number, default: 0 },

  // Status
  isActive:           { type: Boolean, default: true },
  isVerified:         { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ["pending","verified","rejected"], default: "pending" },
  onDuty:             { type: Boolean, default: false },
  currentLocation:    { lat: Number, lng: Number },
  refreshToken:       { type: String },
}, { timestamps: true });

// Auto-generate driverSerial on first save
driverSchema.pre("save", function(next) {
  if (!this.driverSerial) {
    this.driverSerial = "DRV-" + Math.floor(1000 + Math.random() * 9000);
  }
  next();
});

driverSchema.index({ phone: 1, email: 1 });
driverSchema.index({ isActive: 1, verificationStatus: 1 });

module.exports = mongoose.model("Driver", driverSchema);
```

---

### 5.4 Vehicle Model

Fleet asset — tracks type, plate, registration, insurance, service dates, assigned driver, and maintenance history.

```js
// models/vehicleModel.js
const vehicleSchema = new mongoose.Schema({
  name:               { type: String, required: true },
  plateNumber:        { type: String, required: true, unique: true },
  type:               { type: String, enum: ["sedan","suv","hatchback","van","truck"], required: true },
  color:              String,
  registrationNumber: { type: String, unique: true },
  registrationExpiry: Date,
  insuranceExpiry:    Date,
  fuelType:           { type: String, enum: ["petrol","diesel","electric","hybrid"], default: "petrol" },
  mileage:            { type: Number, default: 0 },
  lastServiceDate:    Date,
  nextServiceDue:     Date,
  status: {
    type: String,
    enum: ["active","inactive","maintenance","retired"],
    default: "active"
  },
  assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null },
  documents: { rc: String, insurance: String, pollution: String, fitness: String },
  maintenanceHistory: [{
    date:        { type: Date, default: Date.now },
    type:        String,
    description: String,
    cost:        Number
  }],
  tripCount:    { type: Number, default: 0 },
  totalEarnings:{ type: Number, default: 0 },
}, { timestamps: true });

vehicleSchema.index({ assignedDriver: 1 });
vehicleSchema.index({ status: 1 });

module.exports = mongoose.model("Vehicle", vehicleSchema);
```

---

### 5.5 Trip Model

Lifecycle of a single trip from request to completion, including pickup/drop locations, fare, rating, and feedback.

```js
// models/tripModel.js
const tripSchema = new mongoose.Schema({
  driverId:  { type: mongoose.Schema.Types.ObjectId, ref: "Driver",  required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: false },
  isBilled:  { type: Boolean, default: false },
  fare:      { type: Number,  default: 0 },
  toll:      { type: Number,  default: 0 },
  status: {
    type: String,
    enum: ["requested","assigned","arrived_pickup","in_progress","completed","cancelled"],
    default: "requested"
  },
  passengerDetails: { name: String, phone: String },
  startTime: Date,
  endTime:   Date,
  pickupLocation: { address: String, latitude: Number, longitude: Number },
  dropLocation:   { address: String, latitude: Number, longitude: Number },
  distance: { type: Number, default: 0 },   // km
  duration: { type: Number, default: 0 },   // minutes
  rating:   { type: Number, min: 1, max: 5 },
  review:   String,
  feedback: {
    cleanliness:   Boolean,
    safety:        Boolean,
    communication: Boolean,
    drivingSkill:  Boolean,
  },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

tripSchema.index({ driverId: 1, status: 1 });
tripSchema.index({ date: -1 });

module.exports = mongoose.model("Trip", tripSchema);
```

---

### 5.6 Earnings Model

Aggregated earnings per driver per billing period.

```js
// models/earningsModel.js
const earningsSchema = new mongoose.Schema({
  driverId:         { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
  fromDate:         { type: Date, required: true },
  toDate:           { type: Date, required: true },
  period:           { type: String, enum: ["daily","weekly","monthly"], default: "daily" },
  totalEarning:     { type: Number, default: 0 },
  totalTrips:       { type: Number, default: 0 },
  totalToll:        { type: Number, default: 0 },
  totalRent:        { type: Number, default: 0 },
  totalBonus:       { type: Number, default: 0 },
  totalIncentives:  { type: Number, default: 0 },
  subscription:     { type: Number, default: 0 },
  advance:          { type: Number, default: 0 },
  payout:           { type: Number, default: 0 },
  balance:          { type: Number, default: 0 },
  totalDistance:    { type: Number, default: 0 },
  totalHours:       { type: Number, default: 0 },
  avgEarningPerTrip:{ type: Number, default: 0 },
  avgEarningPerHour:{ type: Number, default: 0 },
  status:           { type: String, enum: ["pending","approved","paid"], default: "pending" },
  paidAt:           Date,
}, { timestamps: true });

earningsSchema.index({ driverId: 1, period: 1 });
earningsSchema.index({ fromDate: 1, toDate: 1 });

module.exports = mongoose.model("Earnings", earningsSchema);
```

---

### 5.7 Billing Model

Full-featured billing record including deductions, bonuses, taxes, payment tracking, dispute handling and audit trail.

```js
// models/billingModel.js — key schema structure
const billingSchema = new mongoose.Schema({
  driverId:   { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
  billNumber: { type: String, unique: true },   // auto-generated BILL-YYYYMM-XXXXXX
  billType:   { type: String, enum: ["weekly","monthly","quarterly","custom"], default: "weekly" },
  periodStartDate: { type: Date, required: true },
  periodEndDate:   { type: Date, required: true },
  billStatus: {
    type: String,
    enum: ["draft","pending","approved","sent","partially_paid","paid","overdue","canceled"],
    default: "pending"
  },

  // Earnings section
  grossEarnings:     { type: Number, default: 0 },
  totalTrips:        { type: Number, default: 0 },
  completedTrips:    { type: Number, default: 0 },
  cancelledTrips:    { type: Number, default: 0 },
  peakHoursEarnings: { type: Number, default: 0 },
  bonusEarnings:     { type: Number, default: 0 },
  earningsByCategory:{ regular: Number, surge: Number, bonus: Number, referral: Number },

  // Deductions section
  totalDeductions:      { type: Number, default: 0 },
  vehicleRent:          { type: Number, default: 0 },
  fuelCharges:          { type: Number, default: 0 },
  maintenanceCharges:   { type: Number, default: 0 },
  insurancePremium:     { type: Number, default: 0 },
  gpsTrackerFee:        { type: Number, default: 0 },
  administrativeFee:    { type: Number, default: 0 },
  tollCharges:          { type: Number, default: 0 },
  penaltyDeductions:    { type: Number, default: 0 },
  advanceSalaryDeduction:{ type: Number, default: 0 },
  commissionPercentage: { type: Number, default: 0 },
  commissionAmount:     { type: Number, default: 0 },

  // Bonuses
  performanceBonus:           { type: Number, default: 0 },
  tripCompletionBonus:        { type: Number, default: 0 },
  safetyBonus:                { type: Number, default: 0 },
  punctualityBonus:           { type: Number, default: 0 },
  customerSatisfactionBonus:  { type: Number, default: 0 },

  // Taxes
  totalTaxes:  { type: Number, default: 0 },
  gstAmount:   { type: Number, default: 0 },
  tdsDeduction:{ type: Number, default: 0 },

  // Financials summary
  netEarnings:    { type: Number, default: 0 },
  finalAmount:    { type: Number, default: 0 },

  // Payment tracking
  paymentStatus: { type: String, enum: ["unpaid","partially_paid","paid"], default: "unpaid" },
  payments: [{ amount: Number, date: Date, method: String, referenceNumber: String }],
  totalPaid:    { type: Number, default: 0 },
  totalPending: { type: Number, default: 0 },

  // Audit trail
  auditTrail: [{ action: String, changedBy: mongoose.Schema.Types.ObjectId,
                 changedAt: Date, changes: mongoose.Schema.Types.Mixed }],

  // Disputes
  disputes: [{ raisedBy: mongoose.Schema.Types.ObjectId, reason: String,
               status: { type: String, enum: ["open","in_review","resolved","closed"] } }],

  isOverdue: { type: Boolean, default: false },
  lateFee:   { type: Number, default: 0 },
  approvedBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

// Auto bill-number generation
billingSchema.pre("save", function(next) {
  if (!this.billNumber) {
    const d = new Date();
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.billNumber = `BILL-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}-${rand}`;
  }
  next();
});

module.exports = mongoose.model("Billing", billingSchema);
```

---

### 5.8 Payment / Wallet / Transaction Models

Multiple models exported from a single file covering: wallet balance, subscription plans, payment methods (card/UPI/bank), transactions, automated payouts, and driver subscriptions.

```js
// models/paymentModel.js — exported models
module.exports = {
  Payment:             mongoose.model("Payment",             paymentSchema),
  Wallet:              mongoose.model("Wallet",              walletSchema),
  SubscriptionPlan:    mongoose.model("SubscriptionPlan",    subscriptionPlanSchema),
  PaymentMethod:       mongoose.model("PaymentMethod",       paymentMethodSchema),
  Transaction:         mongoose.model("Transaction",         transactionSchema),
  AutomatedPayout:     mongoose.model("AutomatedPayout",     automatedPayoutSchema),
  DriverSubscription:  mongoose.model("DriverSubscription",  driverSubscriptionSchema),
};
```

**Wallet schema key fields:**
```js
const walletSchema = new mongoose.Schema({
  driverId:           { type: ObjectId, ref: "Driver", required: true, unique: true },
  balance:            { type: Number, default: 0, min: 0 },
  totalEarned:        { type: Number, default: 0 },
  totalSpent:         { type: Number, default: 0 },
  totalWithdrawn:     { type: Number, default: 0 },
  currency:           { type: String, default: "INR" },
  isActive:           { type: Boolean, default: true },
  walletLocking: { isLocked: Boolean, lockedUntil: Date, reason: String },
});
```

**Transaction schema key fields:**
```js
const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  driverId:      { type: ObjectId, ref: "Driver", required: true },
  type:          { type: String, enum: ["credit","debit","refund","adjustment","bonus","penalty","payout"] },
  category:      { type: String, enum: ["earnings","payment","withdrawal","subscription","bonus","penalty","adjustment"] },
  amount:        { type: Number, required: true, min: 0 },
  status:        { type: String, enum: ["pending","processing","completed","failed","reversed"] },
  fees:          { platformFee: Number, gatewayFee: Number, taxAmount: Number },
  netAmount:     { type: Number, required: true },
  walletBalanceBefore: Number,
  walletBalanceAfter:  Number,
});
```

---

### 5.9 Incident Model

Records accidents, violations, complaints and vehicle damage with severity, resolution status, and repair cost tracking.

```js
// models/incidentModel.js
const incidentSchema = new mongoose.Schema({
  driverId:  { type: ObjectId, ref: "Driver", required: true },
  vehicleId: { type: ObjectId, ref: "Vehicle", default: null },
  type: {
    type: String,
    enum: ["accident","speeding","violation","complaint","late_cancellation",
           "no_show","vehicle_damage","rude_behavior","other"],
    required: true
  },
  description: { type: String, required: true },
  severity:    { type: String, enum: ["low","medium","high","critical"], default: "medium" },
  status:      { type: String, enum: ["reported","under_review","resolved","closed"], default: "reported" },
  reportedBy:  String,
  evidenceUrl: [{ type: String }],
  resolution:  String,
  resolvedAt:  Date,
  safetyScore: { type: Number, default: 0, min: 0, max: 100 },

  // Repair tracking
  repairCompleted:     { type: Boolean, default: false },
  partsUsed:           [{ partName: String, quantity: Number, unitCost: Number }],
  totalRepairCost:     { type: Number, default: 0 },
  payrollDeducted:     { type: Boolean, default: false },
  payrollDeductionAmount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Incident", incidentSchema);
```

---

### 5.10 Location / Geofence Models

Four models for real-time telematics: live location (TTL 24 h), geofence zones, route history with violation logging, and geofence alerts.

```js
// models/locationModel.js

// Live Location — auto-expires after 24 hours
const liveLocationSchema = new mongoose.Schema({
  driverId:  { type: ObjectId, ref: "Driver", required: true },
  tripId:    { type: ObjectId, ref: "Trip" },
  latitude:  { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy:  { type: Number, default: 0 },
  speed:     { type: Number, default: 0 },
  heading:   { type: Number, default: 0 },
  isActive:  { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now, expires: 86400 }   // TTL index
});

// Geofence zone
const geofenceSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  latitude:   { type: Number, required: true },
  longitude:  { type: Number, required: true },
  radius:     { type: Number, required: true, min: 10, max: 50000, default: 500 },
  type:       { type: String, enum: ["pickup","dropoff","restricted","hub","premium_zone"] },
  alertType:  { type: String, enum: ["enter","exit","both"], default: "both" },
  notifyAdmins: { type: Boolean, default: false },
  notifyDriver: { type: Boolean, default: false },
  isActive:   { type: Boolean, default: true },
});

// Route history with violation tracking
const routeHistorySchema = new mongoose.Schema({
  tripId:    { type: ObjectId, ref: "Trip",    required: true },
  driverId:  { type: ObjectId, ref: "Driver",  required: true },
  vehicleId: { type: ObjectId, ref: "Vehicle" },
  distance:  Number, duration: Number, avgSpeed: Number, maxSpeed: Number,
  route: [{ latitude: Number, longitude: Number, timestamp: Date, speed: Number }],
  violations: [{
    type:     { type: String, enum: ["speeding","harsh_acceleration","harsh_braking","sharp_turn","geofence_breach"] },
    severity: { type: String, enum: ["low","medium","high","critical"] },
    timestamp: Date, location: { latitude: Number, longitude: Number }
  }],
  efficiency: { type: Number, min: 0, max: 100 },
  status:     { type: String, enum: ["active","completed","cancelled"], default: "active" },
});

module.exports = {
  LiveLocation:   mongoose.model("LiveLocation",   liveLocationSchema),
  Geofence:       mongoose.model("Geofence",       geofenceSchema),
  RouteHistory:   mongoose.model("RouteHistory",   routeHistorySchema),
  GeofenceAlert:  mongoose.model("GeofenceAlert",  geofenceAlertSchema),
};
```

---

### 5.11 Notification Models

Multi-channel notification system (SMS, email, push, in-app) with templates, per-user preferences, and a log collection with 30-day TTL.

```js
// models/notificationModel.js

// Template (reusable per-channel content)
const notificationTemplateSchema = ...  // templateId, channels{sms,email,push,inApp}, content, priority

// Delivery log (TTL 30 days)
const notificationLogSchema = ...       // recipientId, status per channel, retries, deliveryErrors

// Per-user preferences
const userNotificationPreferencesSchema = ... // channels, categories, quietHours, frequencyLimits

// In-app bell notifications
const inAppNotificationSchema = ...     // title, body, type, isRead, priority, expiresAt

module.exports = {
  NotificationTemplate, NotificationLog,
  UserNotificationPreferences, InAppNotification, Notification
};
```

---

## 6. Middleware

### 6.1 Auth Middleware

Three exported functions: `protect` (JWT verification), `adminOnly` (role check), `checkPermission` (fine-grained permission check with admin-absence mode).

```js
// middleware/authMiddleware.js

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Look up user across all three models: AdminUser → User → Driver
      let user = await AdminUser.findById(decoded.id).select("-password");
      if (!user) user = await User.findById(decoded.id).select("-password");
      if (!user) {
        const Driver = require("../models/driverModel");
        user = await Driver.findById(decoded.id).select("-password");
        if (user) { user = user.toObject(); user.role = "driver"; }
      }

      if (!user) return res.status(401).json({ message: "User not found" });
      if (!user.isActive) return res.status(403).json({ message: "Account suspended." });

      // Temporary access window check
      const now = new Date();
      if (user.isTemporary) {
        if (user.accessStartsAt && now < user.accessStartsAt)
          return res.status(403).json({ message: `Access starts at ${user.accessStartsAt}` });
        if (user.accessExpiresAt && now > user.accessExpiresAt)
          return res.status(403).json({ message: "Temporary access has expired." });
      }

      req.user = user;
      return next();
    } catch (error) {
      if (["JsonWebTokenError","TokenExpiredError","NotBeforeError"].includes(error.name))
        return res.status(401).json({ message: "Not authorized, token failed" });
      return res.status(500).json({ message: "Authentication service unavailable" });
    }
  }
  if (!token) return res.status(401).json({ message: "Not authorized, no token" });
};

const adminOnly = (req, res, next) => {
  const adminRoles = ["admin","super_admin","sub_admin","finance","operations","support","manager","superadmin"];
  if (req.user && (adminRoles.includes(req.user.role) || req.user.isAdminModel)) return next();
  return res.status(403).json({ message: "Only administrators can access this resource." });
};

const checkPermission = (permission) => async (req, res, next) => {
  // Super admin bypasses all permission checks
  if (["super_admin","superadmin"].includes(req.user?.role)) return next();

  // Admin-absence mode blocks destructive actions
  const config = await SystemConfig.findOne({ key: "global_settings" });
  if (config?.adminAbsent) {
    const RESTRICTED = ["manage_financials","manage_subadmins","delete_driver","delete_vehicle","manage_drivers"];
    if (RESTRICTED.includes(permission))
      return res.status(403).json({ message: "Admin Absence Mode: Action restricted." });
  }

  if (req.user?.permissions?.includes(permission)) return next();
  return res.status(403).json({ message: `Access denied. Missing permission: ${permission}` });
};

module.exports = { protect, adminOnly, checkPermission };
```

---

### 6.2 Rate-Limit Middleware

```js
// middleware/rateLimitMiddleware.js
const rateLimit = require("express-rate-limit");

// 100 req / 15 min (general) — skipped in development
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  message: "Too many requests from this IP, please try again later.",
  skip: (req) => process.env.NODE_ENV === "development",
});

// 20 req / 15 min (auth) — only counts failed requests
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  skipSuccessfulRequests: true,
  skip: (req) => process.env.NODE_ENV === "development",
});

// 20 req / 1 hour (payments)
const paymentLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20 });

// 200 req / 1 hour (admin)
const adminLimiter  = rateLimit({ windowMs: 60 * 60 * 1000, max: 200 });

module.exports = { generalLimiter, authLimiter, paymentLimiter, adminLimiter };
```

---

### 6.3 Error Handler Middleware

```js
// middleware/errorHandler.js

class APIError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details    = details;
    this.timestamp  = new Date().toISOString();
  }
}

const errorHandler = (err, req, res, next) => {
  // Joi validation error
  if (err.isJoi)
    return res.status(400).json({ success: false, message: "Validation error", errors: err.details });

  // MongoDB duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ success: false, message: `${field} already exists` });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError")
    return res.status(401).json({ success: false, message: "Invalid token" });
  if (err.name === "TokenExpiredError")
    return res.status(401).json({ success: false, message: "Token expired" });

  // Custom APIError
  if (err instanceof APIError)
    return res.status(err.statusCode).json({ success: false, message: err.message, details: err.details });

  // Fallback
  res.status(err.statusCode || 500).json({
    success: false, message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

const notFoundHandler = (req, res) =>
  res.status(404).json({ success: false, message: "Route not found", path: req.path });

module.exports = { APIError, errorHandler, notFoundHandler };
```

---

## 7. Routes

### 7.1 Auth Routes

```js
// routes/authRoutes.js
const router = express.Router();

// POST /api/auth/register — create new User
router.post("/register", async (req, res) => { /* hash password, create User */ });

// POST /api/auth/login — targeted portal-based lookup (admin | driver | general)
router.post("/login", async (req, res) => {
  const { email, password, portal } = req.body;

  let user = null;
  if (portal === "admin") {
    // Look in AdminUser first, fall back to User with admin role
    user = await AdminUser.findOne({ email: emailLower });
    if (!user) user = await User.findOne({ email: emailLower });
  } else if (portal === "driver") {
    user = await Driver.findOne({ email: emailLower });
  } else {
    // Legacy: User → AdminUser → Driver
    user = await User.findOne({ email: emailLower })
      || await AdminUser.findOne({ email: emailLower })
      || await Driver.findOne({ email: emailLower });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, role, isDriverModel, isAdminModel, permissions: user.permissions || [] },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.status(200).json({ success: true, token, data: { id, name, email, role, phone } });
});

// GET  /api/auth/profile  — returns logged-in user profile (protect middleware)
router.get("/profile", protect, async (req, res) => { /* lookup across all models */ });

// POST /api/auth/reset-password — change password (no OTP, direct reset)
router.post("/reset-password", async (req, res) => { /* lookup user, hash & save new password */ });

module.exports = router;
```

---

### 7.2 Driver Routes

```js
// routes/driverRoutes.js
router.post(
  "/register",
  protect, adminOnly,
  upload.fields([           // multer: aadharCard, drivingLicense, panCard, documents
    { name: "aadharCard",      maxCount: 1 },
    { name: "drivingLicense",  maxCount: 1 },
    { name: "panCard",         maxCount: 1 },
    { name: "documents",       maxCount: 5 },
  ]),
  registerDriver
);

router.post("/bulk-register", protect, adminOnly, bulkRegisterDrivers);

router.get("/",            protect, adminOnly, getDrivers);         // all drivers
router.get("/active",      protect, adminOnly, getActiveDrivers);   // on-duty drivers
router.get("/search",      protect, adminOnly, searchDrivers);      // ?q=name
router.get("/me/performance", protect, getMyPerformance);           // self performance

router.get("/:id",             protect, getDriverById);
router.get("/:id/performance", protect, getDriverPerformance);

router.put("/:id",       protect, adminOnly, upload.fields([...]), updateDriver);
router.put("/:id/verify",protect, adminOnly, verifyDriver);
router.put("/:id/kyc-status", protect, adminOnly, verifyDocuments);

router.post("/:id/safety-alert", protect, adminOnly, sendSafetyAlert);
router.delete("/:id",    protect, adminOnly, deleteDriver);

module.exports = router;
```

---

## 8. Controllers

### 8.1 Auth Controller

```js
// controllers/authController.js

// REGISTER
exports.register = async (req, res) => {
  const { name, phone, email, password, role } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
  const user = await User.create({ name, phone, email, password: hashedPassword, role });
  res.status(201).json({ message: "User registered successfully", user });
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({ message: "Login successful", token, user: { id, name, email, role, phone } });
};
```

---

### 8.2 Driver Controller (Registration)

Key highlights: Joi schema validation, Cloudinary upload helper, duplicate-check across email/phone/aadharNumber.

```js
// controllers/driverController.js (selected excerpts)

// Joi validation schema
const driverRegistrationSchema = Joi.object({
  name:          Joi.string().min(2).max(50).required(),
  phone:         Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  email:         Joi.string().email().required(),
  password:      Joi.string().min(6).required(),
  age:           Joi.number().min(18).max(70).required(),
  experience:    Joi.number().min(0).max(50).required(),
  aadharNumber:  Joi.string().pattern(/^\d{12}$/).required(),
  panNumber:     Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
  licenseNumber: Joi.string().min(10).max(20).required(),
  licenseExpiry: Joi.date().greater("now").required(),
  address: Joi.object({
    street: Joi.string().required(), city: Joi.string().required(),
    state:  Joi.string().required(), pincode: Joi.string().pattern(/^\d{6}$/).required()
  }).required(),
  emergencyContact: Joi.object({
    name: Joi.string().required(), phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    relationship: Joi.string().required()
  }).required(),
  rentType:     Joi.string().valid("weekly","monthly").default("weekly"),
  weeklyRent:   Joi.number().min(0).default(0),
  monthlyRent:  Joi.number().min(0).default(0),
  maritalStatus:Joi.string().valid("single","married","divorced","widowed").default("single"),
});

// Cloudinary upload helper
const uploadToCloudinary = (buffer, folder, filename) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: filename, resource_type: "auto" },
      (error, result) => error ? reject(error) : resolve(result)
    );
    stream.end(buffer);
  });

// Multer — memory storage, 5 MB limit, images + PDF only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf")
      return cb(null, true);
    cb(new Error("Only images and PDF files are allowed"), false);
  }
});

// registerDriver — main handler
const registerDriver = asyncHandler(async (req, res) => {
  const { error } = driverRegistrationSchema.validate(req.body);
  if (error) throw new Error(error.details[0].message);

  // Check uniqueness across email, phone, aadharNumber
  const driverExists = await Driver.findOne({ $or: [{ email }, { phone }, { aadharNumber }] });
  if (driverExists) throw new Error("Driver with these credentials already exists");

  // Upload documents to Cloudinary
  const [aadharResult, licenseResult] = await Promise.all([
    uploadToCloudinary(req.files.aadharCard[0].buffer, "drivers/aadhar", `aadhar_${Date.now()}`),
    uploadToCloudinary(req.files.drivingLicense[0].buffer, "drivers/license", `license_${Date.now()}`),
  ]);

  const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
  const driver = await Driver.create({
    ...req.body,
    password: hashedPassword,
    aadharCard: aadharResult.secure_url,
    drivingLicense: licenseResult.secure_url,
    verificationStatus: "pending",
  });

  res.status(201).json({ success: true, message: "Driver registered successfully", data: driver });
});
```

---

### 8.3 Vehicle Controller

```js
// controllers/vehicleController.js (key functions)

// GET /api/vehicles — filtering, search, pagination
const getVehicles = asyncHandler(async (req, res) => {
  const { status, assignedDriver, search, page = 1, limit = 10 } = req.query;
  let query = {};
  if (status && status !== "all") query.status = status;
  if (assignedDriver) query.assignedDriver = assignedDriver;
  if (search) {
    const driverIds = (await Driver.find({ name: { $regex: search, $options: "i" } })).map(d => d._id);
    query.$or = [
      { plateNumber: { $regex: search, $options: "i" } },
      { assignedDriver: { $in: driverIds } }
    ];
  }
  const vehicles = await Vehicle.find(query)
    .populate("assignedDriver", "name phone email onDuty")
    .skip((page - 1) * limit).limit(+limit).sort({ createdAt: -1 });
  const total = await Vehicle.countDocuments(query);
  res.json({ success: true, count: vehicles.length, total, page: +page,
             pages: Math.ceil(total / limit), data: vehicles });
});

// PUT /api/vehicles/:id/assign-driver
const assignDriver = asyncHandler(async (req, res) => {
  const { driverId } = req.body;
  const driver  = await Driver.findById(driverId);
  if (!driver) throw new Error("Driver not found");

  // Remove driver from any other vehicle first
  await Vehicle.updateMany({ assignedDriver: driverId }, { assignedDriver: null });

  const vehicle = await Vehicle.findById(req.params.id);
  vehicle.assignedDriver = driverId;
  await vehicle.save();
  res.json({ success: true, message: "Driver assigned successfully",
             data: await Vehicle.findById(vehicle._id).populate("assignedDriver","name phone email onDuty") });
});

// PUT /api/vehicles/:id/maintenance — append maintenance record
const addMaintenance = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  vehicle.maintenanceHistory.push({ type, description, cost: parseInt(cost) || 0, date: new Date() });
  await vehicle.save();
  res.json({ success: true, message: "Maintenance record added", data: vehicle });
});
```

---

### 8.4 Trip Controller

State-machine for trip lifecycle; automatic earnings credit on completion; admin CRUD and statistics.

```js
// controllers/tripController.js (key functions)

// Driver: GET active trip
exports.getActiveTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findOne({
    driverId: req.user.id,
    status: { $in: ["assigned","arrived_pickup","in_progress"] }
  });
  res.json({ success: true, data: trip || null });
});

// Driver: Simulate a trip dispatch
exports.simulateTrip = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.user.id);
  if (!driver?.onDuty) return res.status(400).json({ message: "Must be On Duty to receive trips." });

  const distanceKm = Math.floor(Math.random() * 18) + 2;
  const fare = 50 + (12 * distanceKm);    // base ₹50 + ₹12/km

  const newTrip = await Trip.create({
    driverId: req.user.id,
    status: "assigned",
    fare, distance: distanceKm, duration: Math.round(distanceKm * 3.5),
    passengerDetails: { name: "Mock Passenger", phone: "+1 555-01XX" },
    pickupLocation:   { address: "123 Pickup Ave", latitude: 40.7128, longitude: -74.0060 },
    dropLocation:     { address: "88 Dropoff Blvd",  latitude: 40.7228, longitude: -73.9960 },
  });
  res.status(201).json({ success: true, data: newTrip });
});

// Driver: Update trip status (state machine)
exports.updateTripStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validTransitions = ["arrived_pickup","in_progress","completed","cancelled"];
  if (!validTransitions.includes(status)) return res.status(400).json({ message: "Invalid status" });

  const trip = await Trip.findOne({ _id: req.params.id, driverId: req.user.id });
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  if (status === "in_progress" && !trip.startTime) trip.startTime = new Date();

  if (status === "completed") {
    trip.endTime = new Date();
    // Credit earnings for the completed trip
    await Earnings.findOneAndUpdate(
      { driverId: req.user.id, fromDate: { $lte: new Date() }, toDate: { $gte: new Date() } },
      { $inc: { totalEarning: trip.fare, totalDistance: trip.distance, totalTrips: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  trip.status = status;
  await trip.save();
  res.json({ success: true, data: trip, message: `Trip marked as ${status}` });
});

// Admin: Trip statistics (aggregation)
exports.getTripStatsAdmin = asyncHandler(async (req, res) => {
  const [statusCounts, totalTrips, todaysTrips, revenueData] = await Promise.all([
    Trip.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Trip.countDocuments(),
    Trip.countDocuments({ createdAt: { $gte: startOfToday } }),
    Trip.aggregate([{ $group: { _id: null, totalRevenue: { $sum: "$fare" }, avgFare: { $avg: "$fare" } } }]),
  ]);
  res.json({ success: true, data: { totalTrips, todaysTrips, byStatus, totalRevenue, avgFare } });
});
```

---

## 9. Real-Time Socket — `sockets/socket.js`

Socket.IO wrapper for broadcasting driver status, live location, trip events, and geofence alerts.

```js
// sockets/socket.js
const { Server } = require("socket.io");
let io;

function initSocket(server) {
  io = new Server(server, { cors: { origin: "*", methods: ["GET","POST"] } });

  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    // Driver emits → admin receives
    socket.on("driver:status",      (data) => io.emit("admin:driver-status",   data));
    socket.on("driver:location",    (data) => io.emit("admin:driver-location",  data));
    socket.on("driver:route-start", (data) => io.emit("admin:route-start",      data));
    socket.on("driver:route-end",   (data) => io.emit("admin:route-end",        data));

    // Geofence alert
    socket.on("alert:geofence",     (data) => io.emit("admin:geofence-alert",   data));

    socket.on("disconnect", () => console.log("❌ Client disconnected:", socket.id));
  });
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

module.exports = { initSocket, getIO };
```

---

## 10. Frontend — App Router (`App.jsx`)

React Router v6 configuration with `ProtectedRoute` (any authenticated user) and `AdminRoute` (admin-role only).

```jsx
// src/App.jsx
function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <CommandPalette />
          <Routes>
            {/* Public routes */}
            <Route path="/login"          element={<Login />} />
            <Route path="/register"       element={<Register />} />
            <Route path="/forgot-password"element={<ForgotPassword />} />

            {/* Driver / general protected routes */}
            <Route path="/"           element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/earnings"   element={<ProtectedRoute><Earnings /></ProtectedRoute>} />
            <Route path="/performance"element={<ProtectedRoute><Performance /></ProtectedRoute>} />
            <Route path="/incidents"  element={<ProtectedRoute><Incidents /></ProtectedRoute>} />

            {/* Admin-only routes */}
            <Route path="/drivers"         element={<AdminRoute><Drivers /></AdminRoute>} />
            <Route path="/vehicles"        element={<AdminRoute><Vehicles /></AdminRoute>} />
            <Route path="/payments"        element={<AdminRoute><Payments /></AdminRoute>} />
            <Route path="/billing"         element={<AdminRoute><Billing /></AdminRoute>} />
            <Route path="/telematics"      element={<AdminRoute><LiveMap /></AdminRoute>} />
            <Route path="/dispatch"        element={<AdminRoute><Dispatch /></AdminRoute>} />
            <Route path="/maintenance"     element={<AdminRoute><Maintenance /></AdminRoute>} />
            <Route path="/compliance"      element={<AdminRoute><ComplianceCenter /></AdminRoute>} />
            <Route path="/rostering"       element={<AdminRoute><Rostering /></AdminRoute>} />
            <Route path="/payroll"         element={<AdminRoute><Payroll /></AdminRoute>} />
            <Route path="/fleet-performance" element={<AdminRoute><FleetPerformance /></AdminRoute>} />
            <Route path="/admin"           element={<AdminRoute><AdminPanel /></AdminRoute>} />
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users"     element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/tickets"   element={<AdminRoute><SupportTickets /></AdminRoute>} />
            <Route path="/admin/audit-logs"element={<AdminRoute><AuditLogs /></AdminRoute>} />
            <Route path="/admin/reports"   element={<AdminRoute><Reports /></AdminRoute>} />
            <Route path="/admin/invoice-generator" element={<AdminRoute><AdminInvoiceGenerator /></AdminRoute>} />

            {/* Public corporate portal */}
            <Route path="/corporate/b2b-portal" element={<CorporatePortal />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
```

---

## 11. Frontend — Auth Context (`context/AuthContext.jsx`)

Global authentication state — token stored in `localStorage`, profile fetched on load, login/logout helpers exposed via Context.

```jsx
// src/context/AuthContext.jsx
export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user,  setUser]  = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(""); setUser(null);
    localStorage.removeItem("token");
  }, []);

  // Fetch user profile whenever token changes
  const fetchProfile = useCallback(async (authToken) => {
    if (!authToken) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) setUser((await res.json()).data);
      else if (res.status === 401) logout();  // expired → force re-login
    } catch (err) {
      console.error("Profile fetch error:", err);  // network error — keep token
    } finally { setLoading(false); }
  }, [logout]);

  useEffect(() => {
    token ? fetchProfile(token) : setLoading(false);
  }, [token, fetchProfile]);

  // Login — call API, store token
  const login = async (email, password, portal = null) => {
    const res  = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, portal }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Login failed");
    localStorage.setItem("token", data.token);
    setToken(data.token);
    return data;
  };

  const register = async (name, email, password, role, phone) => {
    const res  = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role, phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");
    return data;
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 12. Frontend — Route Guards

### 12.1 ProtectedRoute

Redirects to `/login` if no token exists. Shows loading spinner while auth is resolving.

```jsx
// src/components/ProtectedRoute.jsx
export function ProtectedRoute({ children }) {
  const { token, loading } = useContext(AuthContext);
  if (loading) return <div>Loading Systems...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}
```

---

### 12.2 AdminRoute

Redirects to `/login` if no token. Shows a hard-block UI with "Access Denied" message if the authenticated user is not an admin.

```jsx
// src/components/AdminRoute.jsx
const ADMIN_ROLES = ["admin","super_admin","superadmin","sub_admin","finance","operations","support","manager"];

export function AdminRoute({ children }) {
  const { token, user, loading, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  if (loading || !user) return <Spinner message="Verifying admin access..." />;
  if (!token) return <Navigate to="/login" replace />;

  if (!ADMIN_ROLES.includes(user.role)) {
    // Render hard-block access denied screen
    return (
      <div>
        <ShieldOff /> <h1>Access Denied</h1>
        <p>You do not have permission to access the Admin Control Center.</p>
        <button onClick={() => navigate("/dashboard")}>Go to Driver Portal</button>
        <button onClick={() => { logout(); navigate("/login"); }}>Sign Out</button>
      </div>
    );
  }

  return children;
}
```

---

## 13. Frontend — Login Page

Dual-portal selector (Admin Gateway / Driver Terminal) with role-specific routing after successful authentication.

```jsx
// src/pages/Login.jsx  (simplified)
export function Login() {
  const [portal, setPortal] = useState(null);  // null | 'admin' | 'driver'
  const { login } = useContext(AuthContext);
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resp = await login(email, password, portal);
    const role = resp?.data?.role || "";

    if (portal === "admin") {
      const adminRoles = ["admin","super_admin","sub_admin","finance","operations","support","manager","superadmin"];
      if (adminRoles.includes(role)) navigate("/admin");
      else setError("⛔ Unauthorized: Registered Admins Only.");
    } else {
      if (["admin","super_admin","superadmin"].includes(role))
        setError("⛔ Admin accounts must use the System Command Center.");
      else navigate("/dashboard");
    }
  };

  // Portal selection screen
  if (!portal) return (
    <div>
      <div onClick={() => setPortal("admin")}>
        <Shield /> <h2>Admin Gateway</h2>
      </div>
      <div onClick={() => setPortal("driver")}>
        <Car />   <h2>Driver Terminal</h2>
      </div>
    </div>
  );

  // Login form
  return (
    <form onSubmit={handleSubmit}>
      <input type="email"    value={email}    onChange={e => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Initialize Access Mode</button>
    </form>
  );
}
```

---

## 14. API Endpoint Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login (portal-aware) |
| GET | `/api/auth/profile` | Bearer | Get logged-in user profile |
| POST | `/api/auth/reset-password` | Public | Reset password |
| POST | `/api/drivers/register` | Admin | Register driver with documents |
| POST | `/api/drivers/bulk-register` | Admin | Bulk register drivers |
| GET | `/api/drivers` | Admin | List all drivers |
| GET | `/api/drivers/active` | Admin | List on-duty drivers |
| GET | `/api/drivers/search?q=` | Admin | Search drivers by name |
| GET | `/api/drivers/:id` | Bearer | Get driver by ID |
| PUT | `/api/drivers/:id` | Admin | Update driver |
| PUT | `/api/drivers/:id/verify` | Admin | Verify driver KYC |
| DELETE | `/api/drivers/:id` | Admin | Delete driver |
| GET | `/api/vehicles` | Admin | List vehicles |
| POST | `/api/vehicles` | Admin | Create vehicle |
| POST | `/api/vehicles/batch` | Admin | Bulk create vehicles |
| PUT | `/api/vehicles/:id` | Admin | Update vehicle |
| PUT | `/api/vehicles/:id/assign-driver` | Admin | Assign driver to vehicle |
| PUT | `/api/vehicles/:id/unassign-driver` | Admin | Unassign driver |
| PUT | `/api/vehicles/:id/maintenance` | Admin | Add maintenance record |
| DELETE | `/api/vehicles/:id` | Admin | Delete vehicle |
| GET | `/api/trips/active` | Driver | Get active trip |
| GET | `/api/trips/me` | Driver | Get my trip history |
| POST | `/api/trips/simulate` | Driver | Simulate trip dispatch |
| PUT | `/api/trips/:id/status` | Driver | Update trip status |
| GET | `/api/trips/admin/all` | Admin | All trips with filters |
| POST | `/api/trips/admin/create` | Admin | Create trip |
| PUT | `/api/trips/admin/:id/assign` | Admin | Assign driver to trip |
| PUT | `/api/trips/admin/:id/status` | Admin | Force-update trip status |
| DELETE | `/api/trips/admin/:id` | Admin | Delete trip |
| GET | `/api/trips/admin/stats` | Admin | Trip statistics |
| GET | `/api/earnings` | Bearer | Earnings records |
| GET | `/api/billing` | Admin | Billing records |
| GET | `/api/payments` | Admin | Payment records |
| GET | `/api/analytics` | Admin | Analytics data |
| GET | `/api/incidents` | Bearer | Incident list |
| POST | `/api/incidents` | Bearer | Report incident |
| GET | `/api/location` | Admin | Live locations |
| GET | `/api/notifications` | Bearer | Notifications |
| GET | `/api/admin` | Admin | Admin panel data |
| GET | `/health` | Public | Server health check |
| GET | `/api-docs` | Public | Swagger UI |

---

*Generated from WAID Fleet codebase — covers backend models, middleware, routes, controllers, real-time sockets, and frontend auth/routing.*
