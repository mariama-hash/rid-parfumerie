const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

router.get('/mon-compte/commandes', accountController.orders);
router.get('/mon-compte/commandes/:id', accountController.orderDetail);
router.get('/mon-compte/profil', accountController.showProfile);
router.post('/mon-compte/profil', accountController.updateProfile);

module.exports = router;