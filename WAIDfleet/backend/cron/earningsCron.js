const cron = require("node-cron");
const Earnings = require("../models/earningsModel");
const Driver = require("../models/driverModel");
const Trip = require("../models/tripModel");

const generateEarningsForAllDrivers = async () => {
  try {
    const drivers = await Driver.find({ isActive: true });

    for (const driver of drivers) {
      // Calculate last week range
      const today = new Date();
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(today.getDate() - 7);

      const lastWeekEnd = new Date(today);

      // Fetch completed trips
      const trips = await Trip.find({
        driverId: driver._id,
        status: "completed",
        date: {
          $gte: lastWeekStart,
          $lte: lastWeekEnd,
        },
      });

      let totalEarning = 0;
      let totalToll = 0;

      trips.forEach((trip) => {
        totalEarning += trip.fare || 0;
        totalToll += trip.toll || 0;
      });

      const totalTrips = trips.length;
      const totalRent = driver.weeklyRent || 0;
      const subscription = driver.subscription || 0;
      const advance = 0;

      const payout =
        totalEarning + totalToll - totalRent - subscription - advance;

      const balance = payout;

      // Save earnings
      await Earnings.create({
        driverId: driver._id,
        fromDate: lastWeekStart,
        toDate: lastWeekEnd,
        totalEarning,
        totalTrips,
        totalToll,
        totalRent,
        subscription,
        advance,
        payout,
        balance,
      });
    }

    console.log("Weekly earnings generated successfully for all drivers.");
  } catch (error) {
    console.error("Error generating weekly earnings:", error.message);
  }
};

// Cron Scheduler Function
const scheduleEarningsCron = () => {
  // For testing: runs every minute
  cron.schedule("* * * * *", () => {
    console.log("Testing cron job...");
    generateEarningsForAllDrivers();
  });

  // ✅ For production (Sunday 11:59 PM) use this instead:
  /*
  cron.schedule("59 23 * * 0", () => {
    console.log("Running weekly earnings cron...");
    generateEarningsForAllDrivers();
  });
  */
};

module.exports = scheduleEarningsCron;