require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/userModel");
const AdminUser = require("./models/adminUserModel");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected ✅");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const seedUser = async () => {
  try {
    const email = "admin@waidfleet.com";
    const password = "Admin@123";

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ── User model ──────────────────────────────────────────────────────────
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("ℹ️  User model: admin already exists →", existingUser.email);
    } else {
      await User.create({
        name: "Admin User",
        email,
        password: hashedPassword,
        role: "admin",
        phone: "9876543210",
        isActive: true
      });
      console.log("✅ User model: default admin created");
    }

    // ── AdminUser model (primary auth model for admin portal) ───────────────
    const existingAdminUser = await AdminUser.findOne({ email });
    if (existingAdminUser) {
      console.log("ℹ️  AdminUser model: admin already exists →", existingAdminUser.email);
    } else {
      await AdminUser.create({
        name: "Admin User",
        email,
        password: hashedPassword,
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
      console.log("✅ AdminUser model: default admin created");
    }

    console.log("\n📧 Email:    admin@waidfleet.com");
    console.log("🔑 Password: Admin@123");
    console.log("\nYou can now login with these credentials.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating user:", error.message);
    process.exit(1);
  }
};

connectDB().then(seedUser);
