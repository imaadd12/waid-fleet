const cron = require("node-cron");
const ServiceSchedule = require("../models/serviceScheduleModel");
const Notification = require("../models/notificationModel");

// Schedule service reminders daily at 9:00 AM
// This sends reminders for services due within the reminder period
const scheduleServiceRemindersCron = () => {
  console.log("⏰ Service Reminder Cron Job Scheduled (Daily at 09:00 AM)");

  // Run every day at 09:00 AM
  cron.schedule("0 9 * * *", async () => {
    try {
      console.log("🔄 Running Service Reminder Cron Job...");

      // Get all scheduled services
      const services = await ServiceSchedule.find({ 
        status: { $in: ['scheduled'] },
        notificationSent: false 
      })
        .populate('driverId', 'name phone email')
        .populate('vehicleId', 'name plateNumber');

      let remindersSent = 0;

      for (const service of services) {
        const today = new Date();
        const serviceDate = new Date(service.nextServiceDate);
        const reminderDate = new Date(serviceDate);
        reminderDate.setDate(reminderDate.getDate() - service.reminderDaysBefore);

        // Check if today is the reminder date or past it (but service not completed)
        if (today >= reminderDate && today < serviceDate) {
          // Check if reminder already sent
          const existingNotification = await Notification.findOne({
            serviceScheduleId: service._id,
            type: 'service_reminder',
            isRead: false
          });

          if (!existingNotification) {
            // Create notification
            const notification = await Notification.create({
              driverId: service.driverId._id,
              vehicleId: service.vehicleId._id,
              serviceScheduleId: service._id,
              type: 'service_reminder',
              title: `🔧 Vehicle Service Reminder`,
              message: `Your ${service.vehicleId.name} (${service.vehicleId.plateNumber}) is due for ${service.serviceType} service on ${serviceDate.toLocaleDateString()}. Please book an appointment now.`,
              priority: 'high',
              dueDate: serviceDate,
              status: 'pending'
            });

            // Mark notification as sent
            service.notificationSent = true;
            service.notificationSentDate = new Date();
            await service.save();

            remindersSent++;
            console.log(`✅ Reminder sent to driver ${service.driverId.name} for vehicle ${service.vehicleId.plateNumber}`);
          }
        }

        // Check for overdue services
        if (today > serviceDate && service.status === 'scheduled') {
          service.status = 'overdue';
          await service.save();

          // Create overdue notification
          const overdueNotification = await Notification.create({
            driverId: service.driverId._id,
            vehicleId: service.vehicleId._id,
            serviceScheduleId: service._id,
            type: 'service_overdue',
            title: `⚠️ Service Overdue`,
            message: `Your ${service.vehicleId.name} (${service.vehicleId.plateNumber}) is overdue for ${service.serviceType} service. Please schedule service immediately.`,
            priority: 'critical',
            dueDate: new Date(),
            status: 'pending'
          });

          console.log(`⚠️ Overdue service marked for ${service.driverId.name}`);
        }
      }

      console.log(`✅ Service Reminder Cron Job Completed. ${remindersSent} reminders sent.`);
    } catch (error) {
      console.error("❌ Service Reminder Cron Job Error:", error.message);
    }
  });
};

// Schedule monthly service notifications
// Runs on the same date every month
const scheduleMonthlyServiceNotificationsCron = () => {
  console.log("📅 Monthly Service Notification Cron Job Scheduled");

  // Run at the start of each day to check if today is a service day
  cron.schedule("0 8 * * *", async () => {
    try {
      console.log("🔄 Checking for monthly service dates...");

      // Get all services with monthly frequency
      const services = await ServiceSchedule.find({ 
        frequency: 'monthly',
        status: 'scheduled'
      })
        .populate('driverId', 'name phone email')
        .populate('vehicleId', 'name plateNumber');

      let monthlyNotificationsSent = 0;

      for (const service of services) {
        const today = new Date();
        const lastService = service.lastServiceDate || service.nextServiceDate;
        const nextServiceDate = new Date(lastService);
        
        // Get the day of month from last service
        const serviceDayOfMonth = new Date(lastService).getDate();
        
        // Check if today is the same day of month
        if (today.getDate() === serviceDayOfMonth && !service.notificationSent) {
          // Create monthly notification
          const monthlyNotification = await Notification.create({
            driverId: service.driverId._id,
            vehicleId: service.vehicleId._id,
            serviceScheduleId: service._id,
            type: 'service_due',
            title: `📅 Monthly Service Day`,
            message: `Today is your scheduled monthly service day for ${service.vehicleId.name} (${service.vehicleId.plateNumber}). Please visit the service center.`,
            priority: 'high',
            dueDate: new Date(),
            status: 'pending'
          });

          service.notificationSent = true;
          service.notificationSentDate = new Date();
          await service.save();

          monthlyNotificationsSent++;
          console.log(`✅ Monthly notification sent to driver ${service.driverId.name}`);
        }
      }

      console.log(`✅ Monthly Service Check Completed. ${monthlyNotificationsSent} notifications sent.`);
    } catch (error) {
      console.error("❌ Monthly Service Cron Job Error:", error.message);
    }
  });
};

module.exports = { 
  scheduleServiceRemindersCron, 
  scheduleMonthlyServiceNotificationsCron 
};
