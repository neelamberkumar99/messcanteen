const notificationService = require('../services/notificationService');
const asyncHandler = require('../middlewares/asyncHandler');

// Get my notifications
const getMyNotifications = asyncHandler(async (req, res) => {
  const { limit = 20, skip = 0 } = req.query;
  const result = await notificationService.getUserNotifications(
    req.user.id,
    parseInt(limit),
    parseInt(skip)
  );
  
  res.json({
    success: true,
    data: result.notifications,
    total: result.total,
    unreadCount: result.unreadCount
  });
});

// Mark single notification as read
const markRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const notification = await notificationService.markAsRead(notificationId, req.user.id);
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: notification
  });
});

// Mark all notifications as read
const markAllRead = asyncHandler(async (req, res) => {
  const Notification = require('../models/Notification');
  await Notification.updateMany({ userId: req.user.id, isRead: false }, { $set: { isRead: true } });
  res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = {
  getMyNotifications,
  markRead,
  markAllRead
};
