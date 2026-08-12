const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { User } = require('../models');

// --- Formulaires ---
exports.showRegister = (req, res) => {
  res.render('auth/register', { title: 'Inscription', errors: [], old: {} });
};

exports.showLogin = (req, res) => {
  res.render('auth/login', { title: 'Connexion', errors: [], old: {} });
};

// --- Inscription ---
exports.register = async (req, res) => {
  const errors = validationResult(req);
  const { nom, prenom, email, telephone, password, adresse, ville } = req.body;

  if (!errors.isEmpty()) {
    return res.render('auth/register', {
      title: 'Inscription',
      errors: errors.array(),
      old: req.body,
    });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.render('auth/register', {
        title: 'Inscription',
        errors: [{ msg: 'Cet email est déjà utilisé.' }],
        old: req.body,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      nom,
      prenom,
      email,
      telephone,
      password: hashedPassword,
      adresse,
      ville,
      role: 'client',
    });

    // Connexion automatique après inscription
    req.session.user = {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
    };

    req.flash('success', `Bienvenue chez Rid_Parfumerie, ${user.prenom} !`);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error', "Une erreur est survenue lors de l'inscription.");
    res.redirect('/inscription');
  }
};

// --- Connexion ---
exports.login = async (req, res) => {
  const errors = validationResult(req);
  const { email, password } = req.body;

  if (!errors.isEmpty()) {
    return res.render('auth/login', {
      title: 'Connexion',
      errors: errors.array(),
      old: { email },
    });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.render('auth/login', {
        title: 'Connexion',
        errors: [{ msg: 'Email ou mot de passe incorrect.' }],
        old: { email },
      });
    }

    if (user.actif === false) {
      return res.render('auth/login', {
        title: 'Connexion',
        errors: [{ msg: 'Ce compte a été désactivé. Contacte-nous pour plus d\'informations.' }],
        old: { email },
      });
    }

    req.session.user = {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
    };

    req.flash('success', `Content de te revoir, ${user.prenom} !`);

    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    }
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Une erreur est survenue lors de la connexion.');
    res.redirect('/connexion');
  }
};

// --- Déconnexion ---
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect('/connexion');
  });
};