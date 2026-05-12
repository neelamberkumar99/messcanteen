const express = require('express');
const router = express.Router();
const dietController = require('../controllers/dietController');
const asyncHandler = require('../middlewares/asyncHandler');
const verifyToken = require('../middlewares/auth');
const { isStudent, isAdmin, isAdminOrAbove } = require('../middlewares/roleGuard');

// Student routes
router.get('/status', verifyToken, isStudent, asyncHandler(dietController.getDietStatus));
router.post('/toggle-off', verifyToken, isStudent, asyncHandler(dietController.toggleDietOff));
router.post('/toggle-on', verifyToken, isStudent, asyncHandler(dietController.toggleDietOn));
router.post('/toggle-meal', verifyToken, isStudent, asyncHandler(dietController.toggleMeal));
router.get('/history', verifyToken, isStudent, asyncHandler(dietController.getDietHistory));
router.get('/plan', verifyToken, isStudent, asyncHandler(dietController.getDietPlan));

// Admin route
router.put('/rules', verifyToken, isAdminOrAbove, asyncHandler(dietController.adminUpdateDietRules));

module.exports = router;
