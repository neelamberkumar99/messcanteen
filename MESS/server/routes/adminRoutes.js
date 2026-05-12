const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const { isAdminOrAbove } = require('../middlewares/roleGuard');
const adminController = require('../controllers/adminController');
const { getHostelById } = require('../controllers/adminController');

router.get('/hostel/:id', verifyToken, isAdminOrAbove, getHostelById);

router.get('/students', verifyToken, isAdminOrAbove, adminController.getStudents);
router.get('/stats', verifyToken, isAdminOrAbove, adminController.getStats);
router.post('/students', verifyToken, isAdminOrAbove, adminController.addStudent);
router.put('/students/:id', verifyToken, isAdminOrAbove, adminController.updateStudent);
router.put('/students/:id/deactivate', verifyToken, isAdminOrAbove, adminController.deactivateStudent);

router.get('/contractors', verifyToken, isAdminOrAbove, adminController.getContractors);
router.post('/contractors', verifyToken, isAdminOrAbove, adminController.addContractor);
router.put('/contractors/:id', verifyToken, isAdminOrAbove, adminController.updateContractor);

router.get('/contractor-requests', verifyToken, isAdminOrAbove, adminController.getContractorRequests);
router.put('/contractor-requests/:id/resolve', verifyToken, isAdminOrAbove, adminController.resolveContractorRequest);

router.get('/complaints', verifyToken, isAdminOrAbove, adminController.getComplaints);
router.put('/complaints/:id', verifyToken, isAdminOrAbove, adminController.resolveComplaint);

router.put('/settings/payment-due-days', verifyToken, isAdminOrAbove, adminController.setPaymentDueDays);
router.put('/settings/payment-method', verifyToken, isAdminOrAbove, adminController.setPaymentMethod);

const fineController = require('../controllers/fineController');
router.get('/fines/rules', verifyToken, isAdminOrAbove, fineController.getFineRules);
router.post('/fines/rules', verifyToken, isAdminOrAbove, fineController.setFineRules);

router.get('/reports', verifyToken, isAdminOrAbove, adminController.getReports);
router.get('/diet-metrics', verifyToken, isAdminOrAbove, adminController.getDietMetrics);

router.get('/staff', verifyToken, isAdminOrAbove, adminController.getStaff);
router.post('/staff', verifyToken, isAdminOrAbove, adminController.addStaff);
router.put('/staff/:id', verifyToken, isAdminOrAbove, adminController.updateStaff);
router.put('/settings/diet-rules', verifyToken, isAdminOrAbove, adminController.setDietRules);

// Notification operations used by admin panel
router.get('/notifications', verifyToken, isAdminOrAbove, adminController.getNotificationLog);
router.post('/notifications/bulk', verifyToken, isAdminOrAbove, adminController.sendBulkNotification);
router.post('/notifications/payment-reminder', verifyToken, isAdminOrAbove, adminController.triggerPaymentReminder);
router.post('/notifications/due-alert', verifyToken, isAdminOrAbove, adminController.triggerDueAlert);

module.exports = router;
