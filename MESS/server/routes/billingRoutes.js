const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const { isStudent, isAdminOrAbove, isContractorOrAbove } = require('../middlewares/roleGuard');
const billingController = require('../controllers/billingController');

router.get('/live', verifyToken, isStudent, billingController.getLiveBill);
router.get('/breakdown', verifyToken, isStudent, billingController.getDailyBreakdown);
router.get('/history', verifyToken, isStudent, billingController.getBillHistory);

router.post('/generate', verifyToken, isAdminOrAbove, billingController.generateMonthlyBills);
router.post('/update-fines', verifyToken, isAdminOrAbove, billingController.updateFines);
router.get('/all-students', verifyToken, isContractorOrAbove, billingController.getAllStudentBills);
router.get('/:billId', verifyToken, billingController.getBillById); // student/admin checks in controller

module.exports = router;
