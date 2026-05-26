const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const { isContractorOrAbove } = require('../middlewares/roleGuard');
const canteenController = require('../controllers/canteenController');

// Public route - students can fetch available items
router.get('/available', verifyToken, canteenController.getAvailableItems);

// Contractor gets all their items
router.get('/all', verifyToken, isContractorOrAbove, canteenController.getAllItems);

router.post('/items', verifyToken, isContractorOrAbove, canteenController.addItem);
router.put('/items/:id', verifyToken, isContractorOrAbove, canteenController.editItem);
router.delete('/items/:id', verifyToken, isContractorOrAbove, canteenController.deleteItem);
router.put('/availability', verifyToken, isContractorOrAbove, canteenController.setAvailability);
// Diet plan endpoints for contractors
router.get('/diet-plan', verifyToken, isContractorOrAbove, canteenController.getDietPlan);
router.put('/diet-plan', verifyToken, isContractorOrAbove, canteenController.updateDietPlan);
router.get('/complaints', verifyToken, isContractorOrAbove, canteenController.getComplaints);
router.put('/complaints/:id/resolve', verifyToken, isContractorOrAbove, canteenController.resolveComplaint);

// Contractor Requests to Admin
router.get('/students', verifyToken, isContractorOrAbove, canteenController.searchStudents);
router.get('/requests', verifyToken, isContractorOrAbove, canteenController.getContractorRequests);
router.post('/requests', verifyToken, isContractorOrAbove, canteenController.createContractorRequest);

module.exports = router;
