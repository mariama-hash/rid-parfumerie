const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const { upload, convertToWebP } = require('../middleware/upload');
const productController = require('../controllers/admin/productController');
const orderController = require('../controllers/admin/orderController');
const dashboardController = require('../controllers/admin/dashboardController');
const customerController = require('../controllers/admin/customerController');

router.use(isAdmin);

router.get('/dashboard', dashboardController.show);

// Produits
router.get('/products', productController.list);
router.get('/products/nouveau', productController.showCreate);
router.post('/products/nouveau', upload.single('image'), convertToWebP, productController.create); router.get('/products/:id/modifier', productController.showEdit);
router.post('/products/:id/modifier', upload.single('image'), convertToWebP, productController.update); router.post('/products/:id/supprimer', productController.remove);

// Commandes
router.get('/orders', orderController.list);
router.get('/orders/:id', orderController.detail);
router.post('/orders/:id/statut', orderController.updateStatus);
router.post('/orders/:id/paiement', orderController.updatePaymentStatus);
router.post('/orders/:id/montant', orderController.updateMontantRecu);

// Clients
router.get('/clients', customerController.list);
router.post('/clients/:id/toggle', customerController.toggleActive);
module.exports = router;