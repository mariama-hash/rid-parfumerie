const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { isAuthenticated } = require('../middleware/auth');
const { actionLimiter } = require('../middleware/security');

router.post('/avis', isAuthenticated, actionLimiter, reviewController.create);
router.post('/avis/:id/supprimer', isAuthenticated, reviewController.remove);

module.exports = router;