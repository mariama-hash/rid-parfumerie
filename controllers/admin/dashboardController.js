const { Order, OrderItem, ProductVariant, Product, sequelize } = require('../../models');
const { Op } = require('sequelize');

exports.show = async (req, res) => {
  try {
    // --- Nombre total de commandes ---
    const totalOrders = await Order.count();

    // --- Commandes en attente ---
    const pendingOrders = await Order.count({ where: { statut: 'en_attente' } });

    // --- Ventes totales (hors commandes annulées) ---
    const totalSalesResult = await Order.sum('total', {
      where: { statut: { [Op.ne]: 'annulee' } },
    });
    const totalSales = totalSalesResult || 0;

    // --- Ventes du mois en cours ---
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthSalesResult = await Order.sum('total', {
      where: {
        statut: { [Op.ne]: 'annulee' },
        createdAt: { [Op.gte]: startOfMonth },
      },
    });
    const monthSales = monthSalesResult || 0;

    // --- Produits en stock bas (< 5 unités) ---
    const lowStockVariants = await ProductVariant.findAll({
      where: { stock: { [Op.lt]: 5 } },
      include: [{ model: Product }],
      order: [['stock', 'ASC']],
      limit: 10,
    });

    // --- Dernières commandes ---
    const recentOrders = await Order.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    res.render('admin/dashboard', {
      title: 'Tableau de bord',
      stats: {
        totalOrders,
        pendingOrders,
        totalSales,
        monthSales,
      },
      lowStockVariants,
      recentOrders,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors du chargement du tableau de bord.');
    res.render('admin/dashboard', {
      title: 'Tableau de bord',
      stats: { totalOrders: 0, pendingOrders: 0, totalSales: 0, monthSales: 0 },
      lowStockVariants: [],
      recentOrders: [],
    });
  }
};