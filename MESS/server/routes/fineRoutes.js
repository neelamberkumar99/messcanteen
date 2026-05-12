const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const { isAdminOrAbove } = require('../middlewares/roleGuard');
const fineController = require('../controllers/fineController');

router.get('/rules', verifyToken, fineController.getFineRules);
router.put('/rules', verifyToken, isAdminOrAbove, fineController.setFineRules);
router.get('/breakdown/:billId', verifyToken, fineController.getFineBreakdown);

module.exports = router;
