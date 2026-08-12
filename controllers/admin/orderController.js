const { Order, OrderItem, ProductVariant, Product, Payment, User, Brand } = require('../../models');
const { sendMail } = require('../../utils/mailer');
const { statusUpdateEmail, paymentStatusEmail } = require('../../utils/emailTemplates');

// --- Liste des commandes ---
exports.list = async (req, res) => {
  try {
    const { statut } = req.query;
    const where = statut ? { statut } : {};

    const orders = await Order.findAll({
      where,
      include: [
        { model: User, attributes: ['nom', 'prenom', 'email'] },
        { model: Payment },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.render('admin/orders/list', {
      title: 'Gestion des commandes',
      orders,
      currentStatut: statut || '',
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors du chargement des commandes.');
    res.redirect('/admin/dashboard');
  }
};

// --- Détail d'une commande ---
exports.detail = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['nom', 'prenom', 'email', 'telephone'] },
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
      return res.redirect('/admin/orders');
    }

    res.render('admin/orders/detail', { title: `Commande ${order.numero_commande}`, order });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors du chargement de la commande.');
    res.redirect('/admin/orders');
  }
};

// --- Changer le statut de la commande ---
exports.updateStatus = async (req, res) => {
  try {
    const { statut } = req.body;
    const validStatuts = ['en_attente', 'confirmee', 'expediee', 'livree', 'annulee'];

    if (!validStatuts.includes(statut)) {
      req.flash('error', 'Statut invalide.');
      return res.redirect(`/admin/orders/${req.params.id}`);
    }

    const order = await Order.findByPk(req.params.id, { include: [User] });
    if (!order) {
      req.flash('error', 'Commande introuvable.');
      return res.redirect('/admin/orders');
    }

    await order.update({ statut });

    const statusLabels = {
      en_attente: 'En attente de confirmation',
      confirmee: 'Confirmée',
      expediee: 'Expédiée',
      livree: 'Livrée',
      annulee: 'Annulée',
    };

    if (order.User && order.User.email) {
      sendMail({
        to: order.User.email,
        subject: `Ta commande ${order.numero_commande} — ${statusLabels[statut]}`,
        html: statusUpdateEmail(order, statusLabels[statut]),
      });
    }

    req.flash('success', `Statut mis à jour : ${statut}.`);
    res.redirect(`/admin/orders/${req.params.id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors de la mise à jour du statut.');
    res.redirect(`/admin/orders/${req.params.id}`);
  }
};

// --- Valider / refuser un paiement Mobile Money ---
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { statut } = req.body; // 'valide' ou 'refuse'
    const validStatuts = ['valide', 'refuse'];

    if (!validStatuts.includes(statut)) {
      req.flash('error', 'Statut de paiement invalide.');
      return res.redirect(`/admin/orders/${req.params.id}`);
    }

    const payment = await Payment.findOne({ where: { orderId: req.params.id } });
    if (!payment) {
      req.flash('error', 'Paiement introuvable.');
      return res.redirect(`/admin/orders/${req.params.id}`);
    }

    await payment.update({
      statut,
      valide_par: req.session.user.id,
      valide_le: new Date(),
    });

    const order = await Order.findByPk(req.params.id, { include: [User] });

    if (statut === 'valide' && order && order.statut === 'en_attente') {
      await order.update({ statut: 'confirmee' });
    }

    if (order && order.User && order.User.email) {
      sendMail({
        to: order.User.email,
        subject: `Ta commande ${order.numero_commande} — Paiement ${statut === 'valide' ? 'validé' : 'refusé'}`,
        html: paymentStatusEmail(order, statut === 'valide'),
      });
    }

    req.flash('success', `Paiement ${statut === 'valide' ? 'validé' : 'refusé'}.`);
    res.redirect(`/admin/orders/${req.params.id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors de la mise à jour du paiement.');
    res.redirect(`/admin/orders/${req.params.id}`);
  }
};


// --- Enregistrer le montant réellement reçu (vérification croisée) ---
exports.updateMontantRecu = async (req, res) => {
  try {
    const { montant_recu } = req.body;

    const payment = await Payment.findOne({ where: { orderId: req.params.id } });
    if (!payment) {
      req.flash('error', 'Paiement introuvable.');
      return res.redirect(`/admin/orders/${req.params.id}`);
    }

    await payment.update({ montant_recu: parseFloat(montant_recu) });

    req.flash('success', 'Montant reçu enregistré.');
    res.redirect(`/admin/orders/${req.params.id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors de l\'enregistrement du montant.');
    res.redirect(`/admin/orders/${req.params.id}`);
  }
};