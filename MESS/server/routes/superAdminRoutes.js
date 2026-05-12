const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const { isSuperAdmin } = require('../middlewares/roleGuard');
const {
  getAdmins,
  createAdmin,
  deactivateAdmin,
  getAuditLog,
  publishAnnouncement,
  getSystemStats
} = require('../controllers/superAdminController');

// All routes require superadmin role
router.use(verifyToken);
router.use(isSuperAdmin);

// Admin management
router.get('/admins', getAdmins);
router.post('/admins', createAdmin);
router.put('/admins/:adminId/deactivate', deactivateAdmin);

// Audit log
router.get('/audit-log', getAuditLog);

// Announcements
router.post('/announcements', publishAnnouncement);

// System stats
router.get('/stats', getSystemStats);

module.exports = router;
