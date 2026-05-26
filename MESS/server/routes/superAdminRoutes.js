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
  getSystemStats,
  getHostels,
  createHostel,
  updateHostel,
  deleteHostel
} = require('../controllers/superAdminController');

// All routes require superadmin role
router.use(verifyToken);
router.use(isSuperAdmin);

// Admin management
router.get('/admins', getAdmins);
router.post('/admins', createAdmin);
router.put('/admins/:adminId/deactivate', deactivateAdmin);

// Hostel management
router.get('/hostels', getHostels);
router.post('/hostels', createHostel);
router.put('/hostels/:hostelId', updateHostel);
router.delete('/hostels/:hostelId', deleteHostel);

// Audit log
router.get('/audit-log', getAuditLog);

// Announcements
router.post('/announcements', publishAnnouncement);

// System stats
router.get('/stats', getSystemStats);

module.exports = router;
