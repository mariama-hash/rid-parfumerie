const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { isGuest } = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/security');

const registerValidation = [
  body('nom').trim().notEmpty().withMessage('Le nom est obligatoire.').escape(),
  body('prenom').trim().notEmpty().withMessage('Le prénom est obligatoire.').escape(),
  body('email').trim().isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('telephone').trim().notEmpty().withMessage('Le téléphone est obligatoire.').escape(),
  body('adresse').trim().notEmpty().withMessage("L'adresse est obligatoire.").escape(),
  body('ville').trim().notEmpty().withMessage('La ville est obligatoire.').escape(),
  body('password')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères.')
    .matches(/\d/).withMessage('Le mot de passe doit contenir au moins un chiffre.'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Les mots de passe ne correspondent pas.');
    }
    return true;
  }),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Email invalide.').normalizeEmail(),
  body('password').notEmpty().withMessage('Le mot de passe est obligatoire.'),
];

router.get('/inscription', isGuest, authController.showRegister);
router.post('/inscription', isGuest, registerLimiter, registerValidation, authController.register);

router.get('/connexion', isGuest, authController.showLogin);
router.post('/connexion', isGuest, loginLimiter, loginValidation, authController.login);

router.post('/deconnexion', authController.logout);

module.exports = router;