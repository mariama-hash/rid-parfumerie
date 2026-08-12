const rateLimit = require('express-rate-limit');

// --- Limite les tentatives de connexion (anti brute-force) ---
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6, // 6 tentatives max
  message: 'Trop de tentatives de connexion. Réessaie dans 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    req.flash('error', 'Trop de tentatives de connexion. Réessaie dans 15 minutes.');
    res.redirect('/connexion');
  },
});

// --- Limite les inscriptions (anti spam de comptes) ---
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5,
  message: "Trop de comptes créés depuis cette adresse. Réessaie plus tard.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    req.flash('error', 'Trop de comptes créés depuis cette adresse. Réessaie plus tard.');
    res.redirect('/inscription');
  },
});

// --- Limite générale sur les actions sensibles (commande, avis) ---
const actionLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  message: 'Trop de requêtes. Merci de patienter un instant.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    req.flash('error', 'Trop de requêtes. Merci de patienter un instant.');
    res.redirect('back');
  },
});

module.exports = { loginLimiter, registerLimiter, actionLimiter };