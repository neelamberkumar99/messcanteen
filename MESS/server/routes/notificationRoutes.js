const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const { getMyNotifications, markRead, markAllRead } = require('../controllers/notificationController');

// All routes require authentication
router.use(verifyToken);

// GET /api/notifications - Get my notifications
router.get('/', getMyNotifications);

// PUT /api/notifications/:notificationId/read - Mark single notification as read
router.put('/:notificationId/read', markRead);

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', markAllRead);

module.exports = router;
