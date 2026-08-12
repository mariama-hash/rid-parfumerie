const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { isAuthenticated } = require('../middleware/auth');
const { uploadPayment, convertPaymentToWebP } = require('../middleware/uploadPayment');
const { actionLimiter } = require('../middleware/security');

router.use(isAuthenticated);

router.get('/commande', checkoutController.show);
router.post('/commande', actionLimiter, uploadPayment.single('capture_ecran'), convertPaymentToWebP, checkoutController.process);
router.get('/commande/confirmation/:id', checkoutController.confirmation);

module.exports = router;