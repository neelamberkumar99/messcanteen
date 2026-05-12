const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const { isStudent, isContractor, isAdmin } = require('../middlewares/roleGuard');
const orderController = require('../controllers/orderController');

router.post('/', verifyToken, isStudent, orderController.placeOrder);
router.put('/:id/approve', verifyToken, isContractor, orderController.approveOrder);
router.put('/:id/reject', verifyToken, isContractor, orderController.rejectOrder);
router.post('/contractor-create', verifyToken, isContractor, orderController.createOrderForStudent);
router.get('/my', verifyToken, isStudent, orderController.getMyOrders);
router.get('/pending', verifyToken, isContractor, orderController.getPendingOrders);
router.get('/approved', verifyToken, isContractor, orderController.getContractorApprovedOrders);
router.get('/summary', verifyToken, isContractor, orderController.getContractorOrderSummary);
router.get('/all', verifyToken, isAdmin, orderController.getAllOrders);

module.exports = router;
