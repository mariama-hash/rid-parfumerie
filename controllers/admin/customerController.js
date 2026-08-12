const { User, Order } = require('../../models');
const { Op } = require('sequelize');

// --- Liste des clients avec stats ---
exports.list = async (req, res) => {
  try {
    const customers = await User.findAll({
      where: { role: 'client' },
      order: [['createdAt', 'DESC']],
    });

    const customersWithStats = await Promise.all(customers.map(async (c) => {
      const orders = await Order.findAll({ where: { userId: c.id } });
      const nbCommandes = orders.length;
      const totalDepense = orders
        .filter((o) => o.statut !== 'annulee')
        .reduce((sum, o) => sum + parseFloat(o.total), 0);
      return { ...c.toJSON(), nbCommandes, totalDepense };
    }));

    res.render('admin/customers/list', { title: 'Clients', customers: customersWithStats });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors du chargement des clients.');
    res.redirect('/admin/dashboard');
  }
};

// --- Activer / désactiver un compte client ---
exports.toggleActive = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, role: 'client' } });
    if (!user) {
      req.flash('error', 'Client introuvable.');
      return res.redirect('/admin/clients');
    }

    await user.update({ actif: !user.actif });

    req.flash('success', `Compte ${user.actif ? 'réactivé' : 'désactivé'}.`);
    res.redirect('/admin/clients');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors de la mise à jour du compte.');
    res.redirect('/admin/clients');
  }
};