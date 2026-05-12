const Notification = require('../models/Notification');
const User = require('../models/User');
const Bill = require('../models/Bill');

const notificationService = {
  // Send notification to single user
  async sendNotification(userId, title, message, type = 'system', details = {}) {
    try {
      const notification = new Notification({
        userId,
        title,
        message,
        type,
        ...details
      });
      await notification.save();
      return notification;
    } catch (err) {
      console.error('Error sending notification:', err);
      throw err;
    }
  },

  // Send bulk notification
  async sendBulkNotification(userIds, title, message, type = 'system') {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        title,
        message,
        type
      }));
      const result = await Notification.insertMany(notifications);
      return result;
    } catch (err) {
      console.error('Error sending bulk notifications:', err);
      throw err;
    }
  },

  // Send payment reminder
  async sendPaymentReminder(billId) {
    try {
      const bill = await Bill.findById(billId).populate('studentId');
      if (!bill || !bill.studentId) return null;

      const student = bill.studentId;
      const daysOverdue = Math.floor(
        (new Date() - bill.dueDate) / (1000 * 60 * 60 * 24)
      );

      let message = `Your bill of ₹${bill.totalAmount} is due.`;
      if (daysOverdue > 0) {
        message = `Your bill of ₹${bill.totalAmount} is ${daysOverdue} day(s) overdue. Fine may apply.`;
      }

      const notification = await this.sendNotification(
        student.userId,
        'Payment Due',
        message,
        'payment'
      );
      return notification;
    } catch (err) {
      console.error('Error sending payment reminder:', err);
      throw err;
    }
  },

  // Send reminders for bills due in next 3 days
  async sendUpcomingPaymentReminders() {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(now.getDate() + 3);

      const upcomingBills = await Bill.find({
        status: { $ne: 'paid' },
        dueDate: { $gte: now, $lte: threeDaysFromNow }
      }).populate('studentId');

      const notifications = [];
      for (const bill of upcomingBills) {
        if (!bill.studentId) continue;
        const daysLeft = Math.ceil((bill.dueDate - now) / (1000 * 60 * 60 * 24));
        const message = `Your bill of ₹${bill.totalAmount} is due in ${daysLeft} day(s). Please pay on time to avoid fines.`;
        const notification = await notificationService.sendNotification(
          bill.studentId.userId,
          'Payment Reminder',
          message,
           'payment'
        );
        notifications.push(notification);
      }
      return notifications;
    } catch (err) {
      console.error('Error sending upcoming payment reminders:', err);
      throw err;
    }
  },

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true },
        { new: true }
      );
      return notification;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  },

  // Mark all notifications as read for user
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );
      return result;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  },

  // Get user notifications
  async getUserNotifications(userId, limit = 20, skip = 0) {
    try {
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
      
      const total = await Notification.countDocuments({ userId });
      const unreadCount = await Notification.countDocuments({ userId, isRead: false });

      return { notifications, total, unreadCount };
    } catch (err) {
      console.error('Error fetching user notifications:', err);
      throw err;
    }
  },

  // Get unread count
  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({ userId, isRead: false });
      return count;
    } catch (err) {
      console.error('Error fetching unread count:', err);
      throw err;
    }
  }
};

module.exports = notificationService;
