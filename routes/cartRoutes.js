const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated); // toutes les routes panier nécessitent d'être connecté

router.get('/panier', cartController.show);
router.post('/panier/ajouter', cartController.add);
router.post('/panier/:itemId/quantite', cartController.updateQuantity);
router.post('/panier/:itemId/supprimer', cartController.removeItem);

module.exports = router;