const express = require('express');
const router = express.Router();
const legalController = require('../controllers/legalController');

router.get('/mentions-legales', legalController.mentions);
router.get('/politique-confidentialite', legalController.confidentialite);
router.get('/conditions-generales-vente', legalController.cgv);

module.exports = router;