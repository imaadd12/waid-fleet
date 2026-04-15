require("dotenv").config();
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const AdminUser = require("../models/adminUserModel");

const DEFAULT_ADMIN_EMAIL = "admin@waidfleet.com";
const DEFAULT_ADMIN_PASSWORD = "Admin@123";

/**
 * Ensures the default super admin account exists in both User and AdminUser
 * collections. Called automatically on server startup so the system is always
 * accessible without running a manual seed script.
 */
const initAdmin = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, salt);

    // ── AdminUser model (primary auth model for admin portal) ──────────────
    const existingAdminUser = await AdminUser.findOne({ email: DEFAULT_ADMIN_EMAIL });
    if (!existingAdminUser) {
      await AdminUser.create({
        name: "System Admin",
        email: DEFAULT_ADMIN_EMAIL,
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
      console.log("✅ Default admin created in AdminUser collection");
      console.log(`   📧 Email:    ${DEFAULT_ADMIN_EMAIL}`);
      console.log(`   🔑 Password: ${DEFAULT_ADMIN_PASSWORD}`);
    }

    // ── User model (fallback / legacy auth) ────────────────────────────────
    const existingUser = await User.findOne({ email: DEFAULT_ADMIN_EMAIL });
    if (!existingUser) {
      await User.create({
        name: "System Admin",
        email: DEFAULT_ADMIN_EMAIL,
        password: hashedPassword,
        role: "admin",
        isActive: true
      });
      console.log("✅ Default admin created in User collection (legacy)");
    }
  } catch (err) {
    console.error("⚠️  initAdmin: could not seed default admin —", err.message);
  }
};

module.exports = initAdmin;
