const { Op } = require('sequelize');
const { Product, ProductVariant, Brand, Review, User } = require('../models');
const { getEffectivePrice, getDiscountPercent } = require('../utils/pricing');

exports.show = async (req, res) => {
  try {
    const featured = await Product.findAll({
      where: { actif: true },
      include: [
        { model: Brand },
        { model: ProductVariant, as: 'variants' },
      ],
      order: [['createdAt', 'DESC']],
      limit: 8,
    });

    const NOUVEAU_JOURS = 14;
    const seuilNouveau = new Date();
    seuilNouveau.setDate(seuilNouveau.getDate() - NOUVEAU_JOURS);

    const featuredWithPrice = featured.map((p) => {
      const prices = p.variants.map((v) => getEffectivePrice(v));
      const prixMin = prices.length > 0 ? Math.min(...prices) : null;
      const enStock = p.variants.some((v) => v.stock > 0);
      const estNouveau = new Date(p.createdAt) >= seuilNouveau;
      const meilleureReduc = Math.max(0, ...p.variants.map((v) => getDiscountPercent(v)));
      return { ...p.toJSON(), prixMin, enStock, estNouveau, meilleureReduc };
    });

    const genres = ['Homme', 'Femme', 'Mixte', 'Maison'];
    const genreShowcase = await Promise.all(genres.map(async (genre) => {
      const product = await Product.findOne({
        where: { actif: true, genre, image_principale: { [Op.ne]: null } },
        order: [['createdAt', 'DESC']],
      });
      return { genre, image: product ? product.image_principale : null };
    }));

    const topReviews = await Review.findAll({
      where: { note: { [Op.gte]: 4 } },
      include: [
        { model: User, attributes: ['prenom'] },
        { model: Product, attributes: ['nom', 'slug'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 8,
    });

    // --- Meilleure promo active pour le carrousel ---
    const allActive = await Product.findAll({
      where: { actif: true },
      include: [{ model: ProductVariant, as: 'variants' }],
    });
    let bestPromo = null;
    allActive.forEach((p) => {
      p.variants.forEach((v) => {
        const disc = getDiscountPercent(v);
        if (disc > 0 && (!bestPromo || disc > bestPromo.discount)) {
          bestPromo = { product: p, discount: disc, prixEffectif: getEffectivePrice(v) };
        }
      });
    });

    res.render('home/index', {
      title: 'Rid_Parfumerie — Parfums authentiques à Lomé',
      featured: featuredWithPrice,
      genreShowcase,
      topReviews,
      bestPromo,
    });
  } catch (err) {
    console.error(err);
    res.render('home/index', { title: 'Rid_Parfumerie', featured: [], genreShowcase: [], topReviews: [], bestPromo: null });
  }
};