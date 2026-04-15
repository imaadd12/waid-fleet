const cron = require("node-cron");
const Billing = require("../models/billingModel");
const Driver = require("../models/driverModel");
const Trip = require("../models/tripModel");
const Performance = require("../models/performanceModel");

/**
 * Generate weekly bills every Monday at 00:00 AM
 */
const scheduleWeeklyBillingCron = () => {
  cron.schedule("0 0 * * 1", async () => {
    console.log("🔄 Running weekly billing generation cron job...");

    try {
      const currentDate = new Date();
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const activeDrivers = await Driver.find({ isActive: true });
      let billsGenerated = 0;

      for (const driver of activeDrivers) {
        // Check if bill already exists
        const existingBill = await Billing.findOne({
          driverId: driver._id,
          periodStartDate: startOfWeek,
          billType: "weekly"
        });

        if (existingBill) continue;

        // Get trips
        const trips = await Trip.find({
          driverId: driver._id,
          createdAt: { $gte: startOfWeek, $lte: endOfWeek },
          status: "completed"
        });

        if (trips.length === 0) continue;

        // Calculate earnings
        const grossEarnings = trips.reduce((sum, trip) => sum + (trip.fare || 0), 0);
        const totalTrips = trips.length;
        const completedTrips = trips.filter(t => t.status === "completed").length;
        const averageEarningsPerTrip = totalTrips > 0 ? grossEarnings / totalTrips : 0;
        const averageEarningsPerDay = grossEarnings / 7;

        // Get deductions
        const vehicleRent = driver.weeklyRent || 0;
        const totalDeductions = vehicleRent;

        // Get bonuses
        const performance = await Performance.findOne({ driverId: driver._id });
        const performanceBonus = performance && performance.avgRating >= 4.5 ? grossEarnings * 0.05 : 0;

        // Calculate final amount
        const totalBonuses = performanceBonus;
        const netEarnings = grossEarnings - totalDeductions + totalBonuses;

        await Billing.create({
          driverId: driver._id,
          billType: "weekly",
          periodStartDate: startOfWeek,
          periodEndDate: endOfWeek,
          grossEarnings,
          totalTrips,
          completedTrips,
          vehicleRent,
          totalDeductions,
          performanceBonus,
          totalBonuses,
          netEarnings,
          averageEarningsPerTrip,
          averageEarningsPerDay,
          finalAmount: netEarnings,
          billStatus: "pending",
          paymentTerms: {
            dueDate: new Date(endOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000) // Due in 7 days
          }
        });

        billsGenerated++;
      }

      console.log(`✅ Weekly billing generation completed: ${billsGenerated} bills generated`);

    } catch (error) {
      console.error("❌ Error in weekly billing cron job:", error.message);
    }
  });

  console.log("📅 Weekly billing cron job scheduled: Every Monday at 00:00 AM");
};

/**
 * Generate monthly bills on 1st of month at 00:00 AM
 */
const scheduleMonthlyBillingCron = () => {
  cron.schedule("0 0 1 * *", async () => {
    console.log("🔄 Running monthly billing generation cron job...");

    try {
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const activeDrivers = await Driver.find({ isActive: true });
      let billsGenerated = 0;

      for (const driver of activeDrivers) {
        // Check if bill already exists
        const existingBill = await Billing.findOne({
          driverId: driver._id,
          periodStartDate: startOfMonth,
          billType: "monthly"
        });

        if (existingBill) continue;

        // Get trips
        const trips = await Trip.find({
          driverId: driver._id,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          status: "completed"
        });

        if (trips.length === 0) continue;

        // Calculate earnings
        const grossEarnings = trips.reduce((sum, trip) => sum + (trip.fare || 0), 0);
        const totalTrips = trips.length;
        const completedTrips = trips.filter(t => t.status === "completed").length;

        // Get deductions and bonuses
        const vehicleRent = (driver.weeklyRent || 0) * 4.33;
        const totalDeductions = vehicleRent;

        const performance = await Performance.findOne({ driverId: driver._id });
        const performanceBonus = performance && performance.avgRating >= 4.5 ? grossEarnings * 0.1 : 0;
        const loyaltyBonus = driver.monthsWithCompany >= 6 ? grossEarnings * 0.02 : 0;
        const totalBonuses = performanceBonus + loyaltyBonus;

        // Calculate final amount
        const netEarnings = grossEarnings - totalDeductions + totalBonuses;

        await Billing.create({
          driverId: driver._id,
          billType: "monthly",
          periodStartDate: startOfMonth,
          periodEndDate: endOfMonth,
          grossEarnings,
          totalTrips,
          completedTrips,
          vehicleRent,
          totalDeductions,
          performanceBonus,
          loyaltyBonus,
          totalBonuses,
          netEarnings,
          finalAmount: netEarnings,
          billStatus: "pending",
          paymentTerms: {
            dueDate: new Date(endOfMonth.getTime() + 5 * 24 * 60 * 60 * 1000) // Due in 5 days
          }
        });

        billsGenerated++;
      }

      console.log(`✅ Monthly billing generation completed: ${billsGenerated} bills generated`);

    } catch (error) {
      console.error("❌ Error in monthly billing cron job:", error.message);
    }
  });

  console.log("📅 Monthly billing cron job scheduled: Every 1st of month at 00:00 AM");
};

/**
 * Send payment reminders daily at 09:00 AM
 */
const schedulePaymentRemindersCron = () => {
  cron.schedule("0 9 * * *", async () => {
    console.log("🔄 Running payment reminders cron job...");

    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      const bills = await Billing.find({
        paymentStatus: { $ne: "paid" },
        $expr: {
          $and: [
            { $lte: ["$paymentTerms.dueDate", threeDaysFromNow] },
            { $gte: ["$paymentTerms.dueDate", now] }
          ]
        }
      }).populate("driverId");

      let remindersSent = 0;

      for (const bill of bills) {
        // TODO: Integrate SMS/Email notification here
        // console.log(`Sending reminder to ${bill.driverId.phone} for bill ${bill.billNumber}`);
        
        bill.remindersSent += 1;
        bill.lastReminderDate = new Date();
        await bill.save();
        remindersSent++;
      }

      console.log(`✅ Payment reminders sent: ${remindersSent} reminders`);

    } catch (error) {
      console.error("❌ Error in payment reminders cron job:", error.message);
    }
  });

  console.log("📅 Payment reminders cron job scheduled: Daily at 09:00 AM");
};

/**
 * Detect and update overdue bills daily at 08:00 AM
 */
const scheduleOverdueDetectionCron = () => {
  cron.schedule("0 8 * * *", async () => {
    console.log("🔄 Running overdue detection cron job...");

    try {
      const now = new Date();

      const bills = await Billing.find({
        paymentStatus: { $ne: "paid" },
        $expr: {
          $lt: ["$paymentTerms.dueDate", now]
        }
      });

      let overdueCount = 0;

      for (const bill of bills) {
        const daysOverdue = Math.floor((now - bill.paymentTerms.dueDate) / (1000 * 60 * 60 * 24));
        
        if (!bill.isOverdue) {
          bill.isOverdue = true;
          bill.billStatus = "overdue";
          overdueCount++;
        }

        bill.daysSinceOverdue = daysOverdue;

        // Calculate late fee (apply after 3-day grace period)
        const gracePeriodDays = 3;
        if (daysOverdue > gracePeriodDays) {
          const lateFeeDays = daysOverdue - gracePeriodDays;
          const lateFeePercent = bill.paymentTerms.lateFeePercent || 2;
          const lateFeeAmount = (bill.finalAmount * lateFeePercent / 100) * (lateFeeDays / 30);
          bill.lateFee = Math.round(lateFeeAmount);
        }

        await bill.save();
      }

      console.log(`✅ Overdue detection completed: ${overdueCount} bills marked as overdue`);

    } catch (error) {
      console.error("❌ Error in overdue detection cron job:", error.message);
    }
  });

  console.log("📅 Overdue detection cron job scheduled: Daily at 08:00 AM");
};

/**
 * Master function to schedule all billing cron jobs
 */
const scheduleBillingCron = () => {
  scheduleWeeklyBillingCron();
  scheduleMonthlyBillingCron();
  schedulePaymentRemindersCron();
  scheduleOverdueDetectionCron();
};

module.exports = scheduleBillingCron;