/**
 * seedLocal.js
 * Seeds a default admin and a default driver into your LOCAL MongoDB.
 *
 * Usage (from WAIDfleet/backend/):
 *   node seedLocal.js
 *
 * Requires: mongod running on localhost:27017
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/userModel");
const AdminUser = require("./models/adminUserModel");
const Driver = require("./models/driverModel");

const LOCAL_URI = "mongodb://localhost:27017/waidFleet";

const seed = async () => {
  try {
    await mongoose.connect(LOCAL_URI);
    console.log("✅ Connected to", LOCAL_URI);

    const salt = await bcrypt.genSalt(10);

    // ── 1. Admin Portal ────────────────────────────────────────────────────────
    const adminEmail = "admin@waidfleet.com";
    const adminPassword = "Admin@123";
    const hashedAdmin = await bcrypt.hash(adminPassword, salt);

    const existingAdminUser = await AdminUser.findOne({ email: adminEmail });
    if (existingAdminUser) {
      console.log("ℹ️  AdminUser already exists:", adminEmail);
    } else {
      await AdminUser.create({
        name: "Admin User",
        email: adminEmail,
        password: hashedAdmin,
        role: "super_admin",
        permissions: [
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
        ],
        isActive: true
      });
      console.log("✅ AdminUser created:", adminEmail);
    }

    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      console.log("ℹ️  User (admin) already exists:", adminEmail);
    } else {
      await User.create({
        name: "Admin User",
        email: adminEmail,
        password: hashedAdmin,
        role: "admin",
        phone: "9000000001",
        isActive: true
      });
      console.log("✅ User (admin) created:", adminEmail);
    }

    // ── 2. Driver Portal ───────────────────────────────────────────────────────
    const driverEmail = "driver@waidfleet.com";
    const driverPassword = "Driver@123";
    const hashedDriver = await bcrypt.hash(driverPassword, salt);

    const existingDriver = await Driver.findOne({ email: driverEmail });
    if (existingDriver) {
      console.log("ℹ️  Driver already exists:", driverEmail);
    } else {
      await Driver.create({
        name: "Test Driver",
        email: driverEmail,
        password: hashedDriver,
        phone: "9000000002",
        age: 30,
        experience: 5,
        aadharCard: "placeholder-aadhar",
        drivingLicense: "placeholder-license",
        aadharNumber: "1234-5678-9012",
        licenseNumber: "DL-0001-2024",
        licenseExpiry: new Date("2028-12-31"),
        address: {
          street: "123 Main St",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001"
        },
        emergencyContact: {
          name: "Emergency Contact",
          phone: "9000000003",
          relationship: "Spouse"
        },
        role: "driver",
        rentType: "weekly",
        weeklyRent: 5000,
        isActive: true,
        isVerified: true,
        verificationStatus: "verified"
      });
      console.log("✅ Driver created:", driverEmail);
    }

    console.log("\n─────────────────────────────────────────");
    console.log("  ADMIN PORTAL LOGIN");
    console.log("  Email   : admin@waidfleet.com");
    console.log("  Password: Admin@123");
    console.log("─────────────────────────────────────────");
    console.log("  DRIVER PORTAL LOGIN");
    console.log("  Email   : driver@waidfleet.com");
    console.log("  Password: Driver@123");
    console.log("─────────────────────────────────────────\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
};

seed();
