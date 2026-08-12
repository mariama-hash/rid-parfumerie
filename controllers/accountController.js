const { Order, OrderItem, ProductVariant, Product, Payment, Brand } = require('../models');

// --- Liste des commandes du client connecté ---
exports.orders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.session.user.id },
      include: [{ model: Payment }],
      order: [['createdAt', 'DESC']],
    });

    res.render('account/orders', { title: 'Mes commandes', orders });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors du chargement de tes commandes.');
    res.redirect('/');
  }
};

// --- Détail d'une commande du client connecté ---
exports.orderDetail = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, userId: req.session.user.id },
      include: [
        { model: Payment },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: ProductVariant, include: [{ model: Product, include: [Brand] }] }],
        },
      ],
    });

    if (!order) {
      req.flash('error', 'Commande introuvable.');
      return res.redirect('/mon-compte/commandes');
    }

    res.render('account/orderDetail', { title: `Commande ${order.numero_commande}`, order });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors du chargement de la commande.');
    res.redirect('/mon-compte/commandes');
  }
};
const bcrypt = require('bcryptjs');
const { User } = require('../models');

// --- Formulaire profil ---
exports.showProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.session.user.id);
    res.render('account/profile', { title: 'Mon profil', profileUser: user, errors: [] });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors du chargement du profil.');
    res.redirect('/');
  }
};

// --- Mise à jour profil ---
exports.updateProfile = async (req, res) => {
  try {
    const { nom, prenom, telephone, adresse, ville, email, newPassword, confirmNewPassword } = req.body;
    const user = await User.findByPk(req.session.user.id);

    if (!user) {
      req.flash('error', 'Compte introuvable.');
      return res.redirect('/mon-compte/profil');
    }

    const updates = { nom, prenom, telephone, adresse, ville };

    // Email modifiable uniquement par l'admin
    if (user.role === 'admin' && email) {
      const existing = await User.findOne({ where: { email } });
      if (existing && existing.id !== user.id) {
        req.flash('error', 'Cet email est déjà utilisé par un autre compte.');
        return res.redirect('/mon-compte/profil');
      }
      updates.email = email;
    }

    // Changement de mot de passe (optionnel)
    if (newPassword) {
      if (newPassword.length < 6) {
        req.flash('error', 'Le nouveau mot de passe doit contenir au moins 6 caractères.');
        return res.redirect('/mon-compte/profil');
      }
      if (newPassword !== confirmNewPassword) {
        req.flash('error', 'Les mots de passe ne correspondent pas.');
        return res.redirect('/mon-compte/profil');
      }
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    await user.update(updates);

    // Met à jour la session avec les nouvelles infos affichées (nom, prénom, email)
    req.session.user.nom = user.nom;
    req.session.user.prenom = user.prenom;
    req.session.user.email = user.email;

    req.flash('success', 'Profil mis à jour avec succès.');
    res.redirect('/mon-compte/profil');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors de la mise à jour du profil.');
    res.redirect('/mon-compte/profil');
  }
};