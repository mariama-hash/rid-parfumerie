const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');

router.get('/produits', shopController.catalog);
router.get('/produits/:slug', shopController.detail);

module.exports = router;