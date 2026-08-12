const { Op } = require('sequelize');
const { Product, ProductVariant, Brand, Category, Review, User } = require('../models');
const { getEffectivePrice, getDiscountPercent } = require('../utils/pricing');
// --- Page catalogue avec filtres ---
exports.catalog = async (req, res) => {
  try {
    const { genre, brand, category, search, sort } = req.query;

    // --- Construction des conditions de filtre ---
    const whereProduct = { actif: true };
    if (genre) whereProduct.genre = genre;
    if (brand) whereProduct.brandId = brand;
    if (search) {
      whereProduct.nom = { [Op.like]: `%${search}%` };
    }

    const include = [
      { model: Brand },
      { model: ProductVariant, as: 'variants' },
      { model: Category, ...(category ? { where: { id: category } } : {}) },
    ];

    let products = await Product.findAll({
      where: whereProduct,
      include,
    });

    // --- Calcul du prix mini par produit (pour l'affichage) ---
    const seuilNouveau = new Date();
    seuilNouveau.setDate(seuilNouveau.getDate() - 14);

    products = products.map((p) => {
      const prices = p.variants.map((v) => parseFloat(v.prix));
      const prixMin = prices.length > 0 ? Math.min(...prices) : null;
      const enStock = p.variants.some((v) => v.stock > 0);
      const estNouveau = new Date(p.createdAt) >= seuilNouveau;
      return { ...p.toJSON(), prixMin, enStock, estNouveau };
    });

    // --- Tri ---
    if (sort === 'prix_asc') {
      products.sort((a, b) => (a.prixMin || 0) - (b.prixMin || 0));
    } else if (sort === 'prix_desc') {
      products.sort((a, b) => (b.prixMin || 0) - (a.prixMin || 0));
    } else if (sort === 'nom') {
      products.sort((a, b) => a.nom.localeCompare(b.nom));
    }

    // --- Compteurs pour les filtres (sur TOUS les produits actifs, pas juste ceux filtrés) ---
    const allActiveProducts = await Product.findAll({
      where: { actif: true },
      include: [{ model: Brand }, { model: Category }],
    });

    const genreCounts = { Homme: 0, Femme: 0, Mixte: 0, Maison: 0 };
    const brandCounts = {};
    const categoryCounts = {};

    allActiveProducts.forEach((p) => {
      if (genreCounts[p.genre] !== undefined) genreCounts[p.genre]++;

      if (p.Brand) {
        const key = p.Brand.id;
        if (!brandCounts[key]) brandCounts[key] = { nom: p.Brand.nom, count: 0 };
        brandCounts[key].count++;
      }

      p.Categories.forEach((cat) => {
        if (!categoryCounts[cat.id]) categoryCounts[cat.id] = { nom: cat.nom, count: 0 };
        categoryCounts[cat.id].count++;
      });
    });

    res.render('shop/catalog', {
      title: 'Nos parfums',
      products,
      genreCounts,
      brandCounts,
      categoryCounts,
      filters: { genre, brand, category, search, sort },
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors du chargement du catalogue.');
    res.redirect('/');
  }
};

// --- Page détail produit ---
exports.detail = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { slug: req.params.slug, actif: true },
      include: [
        { model: Brand },
        { model: Category },
        { model: ProductVariant, as: 'variants' },
        {
          model: Review,
          as: 'reviews',
          required: false,
          include: [{ model: User, attributes: ['prenom'] }],
        },
      ],
      order: [[{ model: Review, as: 'reviews' }, 'createdAt', 'DESC']],
    });

    if (!product) {
      req.flash('error', 'Ce parfum est introuvable ou n\'est plus disponible.');
      return res.redirect('/produits');
    }

    // Note moyenne
    const reviews = product.reviews || [];
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.note, 0) / reviews.length
      : 0;

    // L'utilisateur connecté a-t-il déjà noté ce produit ?
    let userReview = null;
    if (req.session.user) {
      userReview = reviews.find((r) => r.userId === req.session.user.id) || null;
    }

    // Produits similaires
    const similar = await Product.findAll({
      where: {
        actif: true,
        id: { [Op.ne]: product.id },
        [Op.or]: [
          { brandId: product.brandId },
          { genre: product.genre },
        ],
      },
      include: [{ model: ProductVariant, as: 'variants' }],
      limit: 4,
    });

    const variantsWithPrix = product.variants.map((v) => ({
      ...v.toJSON(),
      prixEffectif: getEffectivePrice(v),
      reduction: getDiscountPercent(v),
    }));

    res.render('shop/product', {
      title: product.nom,
      product,
      variantsWithPrix,
      similar,
      avgRating,
      reviewsCount: reviews.length,
      userReview,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors du chargement du produit.');
    res.redirect('/produits');
  }
};