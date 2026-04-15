// Test script to create sample data for billing system
const mongoose = require("mongoose");
const Driver = require("./models/driverModel");
const Trip = require("./models/tripModel");
const Vehicle = require("./models/vehicleModel");
require("dotenv").config();

const createTestData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Create test vehicles
    const vehicles = await Vehicle.insertMany([
      { name: "Toyota Camry", plateNumber: "ABC-123" },
      { name: "Honda Civic", plateNumber: "XYZ-456" },
      { name: "Ford Focus", plateNumber: "DEF-789" }
    ]);
    console.log("Created test vehicles");

    // Create test drivers
    const drivers = await Driver.insertMany([
      {
        name: "John Doe",
        phone: "9876543210",
        email: "john@example.com",
        password: "password123",
        rentType: "weekly",
        weeklyRent: 5000,
        isActive: true
      },
      {
        name: "Jane Smith",
        phone: "9876543211",
        email: "jane@example.com",
        password: "password123",
        rentType: "weekly",
        weeklyRent: 4500,
        isActive: true
      },
      {
        name: "Mike Johnson",
        phone: "9876543212",
        email: "mike@example.com",
        password: "password123",
        rentType: "monthly",
        monthlyRent: 18000,
        isActive: true
      }
    ]);
    console.log("Created test drivers");

    // Create test trips for the current week
    const currentDate = new Date();
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay()); // Start of week

    const trips = [];
    for (let i = 0; i < 7; i++) { // 7 days
      const tripDate = new Date(weekStart);
      tripDate.setDate(weekStart.getDate() + i);

      // Create multiple trips per day for each driver
      drivers.forEach((driver, driverIndex) => {
        const numTrips = Math.floor(Math.random() * 5) + 1; // 1-5 trips per day
        for (let j = 0; j < numTrips; j++) {
          trips.push({
            driverId: driver._id,
            vehicleId: vehicles[driverIndex % vehicles.length]._id,
            fare: Math.floor(Math.random() * 500) + 100, // 100-600 fare
            toll: Math.floor(Math.random() * 100) + 10, // 10-110 toll
            status: "completed",
            date: tripDate
          });
        }
      });
    }

    await Trip.insertMany(trips);
    console.log(`Created ${trips.length} test trips`);

    console.log("Test data created successfully!");
    console.log("You can now test the billing system at http://localhost:5176/dashboard");

  } catch (error) {
    console.error("Error creating test data:", error);
  } finally {
    mongoose.connection.close();
  }
};

createTestData();