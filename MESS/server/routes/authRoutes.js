const express = require('express');
const router = express.Router();
const asyncHandler = require('../middlewares/asyncHandler');
const authController = require('../controllers/authController');
const verifyToken = require('../middlewares/auth');

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.get('/me', verifyToken, asyncHandler(authController.getMe));
router.put('/change-password', verifyToken, asyncHandler(authController.changePassword));

module.exports = router;
