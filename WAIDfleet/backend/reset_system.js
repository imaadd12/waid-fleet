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

const resetSystem = async () => {
    try {
        console.log("Starting System Restoration...");

        const email = "admin@waidfleet.com";
        const password = "Admin@2026!"; // The new temporary secure password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 1. Ensure account exists in User model (for legacy/main auth compat)
        let mainUser = await User.findOne({ email });
        if (mainUser) {
            mainUser.password = hashedPassword;
            mainUser.role = "admin";
            await mainUser.save();
            console.log("Updated existing User account for admin@waidfleet.com");
        } else {
            await User.create({
                name: "System Admin",
                email,
                password: hashedPassword,
                role: "admin",
                isActive: true
            });
            console.log("Created new User account for admin@waidfleet.com");
        }

        // 2. Ensure account exists in AdminUser model (for full permissions & granular control)
        let adminUser = await AdminUser.findOne({ email });
        if (adminUser) {
            adminUser.password = hashedPassword;
            adminUser.role = "super_admin";
            adminUser.permissions = [
                "dashboard", "view_drivers", "manage_drivers", 
                "view_vehicles", "manage_vehicles", "view_incidents", 
                "manage_incidents", "view_earnings", "manage_earnings", 
                "view_reports", "view_financials", "manage_financials"
            ];
            await adminUser.save();
            console.log("Updated existing AdminUser account with permissions");
        } else {
            await AdminUser.create({
                name: "System Admin",
                email,
                password: hashedPassword,
                role: "super_admin",
                permissions: [
                    "dashboard", "view_drivers", "manage_drivers", 
                    "view_vehicles", "manage_vehicles", "view_incidents", 
                    "manage_incidents", "view_earnings", "manage_earnings", 
                    "view_reports", "view_financials", "manage_financials"
                ],
                isActive: true
            });
            console.log("Created new AdminUser account with full permissions");
        }

        console.log("\n✅ RESTORATION COMPLETE");
        console.log("📧 Email: admin@waidfleet.com");
        console.log("🔑 Password: Admin@2026!");
        console.log("-----------------------------------");
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Restoration failed:", error.message);
        process.exit(1);
    }
};

connectDB().then(() => resetSystem());
