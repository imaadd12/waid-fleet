require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/userModel");

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
    // Check if user already exists
    const existingUser = await User.findOne({ email: "admin@waidfleet.com" });
    
    if (existingUser) {
      console.log("❌ User already exists:", existingUser.email);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Admin@123", salt);

    // Create user
    const newUser = await User.create({
      name: "Admin User",
      email: "admin@waidfleet.com",
      password: hashedPassword,
      role: "admin",
      phone: "9876543210",
      isActive: true
    });

    console.log("✅ Default admin user created successfully!");
    console.log("📧 Email: admin@waidfleet.com");
    console.log("🔑 Password: Admin@123");
    console.log("\nYou can now:");
    console.log("1. Login with these credentials");
    console.log("2. Or reset the password using: admin@waidfleet.com");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating user:", error.message);
    process.exit(1);
  }
};

connectDB();
seedUser();
