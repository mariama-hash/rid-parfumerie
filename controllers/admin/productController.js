const { Product, ProductVariant, Brand, Category } = require('../../models');
const fs = require('fs');
const path = require('path');

// Génère un slug simple à partir du nom
function generateSlug(nom) {
  return nom
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire les accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// --- Liste des produits ---
exports.list = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        { model: Brand },
        { model: ProductVariant, as: 'variants' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.render('admin/products/list', { title: 'Gestion des produits', products });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors du chargement des produits.');
    res.redirect('/admin/dashboard');
  }
};

// --- Formulaire de création ---
exports.showCreate = async (req, res) => {
  try {
    const brands = await Brand.findAll({ order: [['nom', 'ASC']] });
    res.render('admin/products/form', {
      title: 'Ajouter un parfum',
      product: null,
      brands,
      errors: [],
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors du chargement du formulaire.');
    res.redirect('/admin/products');
  }
};

// --- Création ---
exports.create = async (req, res) => {
  try {
    const {
      nom, description, notes_tete, notes_coeur, notes_fond, genre,
      brandNom, categoriesTexte,
      contenance_ml, prix, prix_promo, stock,
    } = req.body;

    if (!nom || !genre) {
      req.flash('error', 'Le nom et le genre sont obligatoires.');
      return res.redirect('/admin/products/nouveau');
    }

    // Marque à la volée
    let brandId = null;
    if (brandNom && brandNom.trim() !== '') {
      const [brand] = await Brand.findOrCreate({
        where: { nom: brandNom.trim() },
      });
      brandId = brand.id;
    }

    const slug = generateSlug(nom) + '-' + Date.now();

    const product = await Product.create({
      nom,
      slug,
      description,
      notes_tete,
      notes_coeur,
      notes_fond,
      genre,
      brandId,
      image_principale: req.file ? `/uploads/products/${req.file.filename}` : null,
    });

    // Catégories à la volée (comme la marque)
    if (categoriesTexte && categoriesTexte.trim() !== '') {
      const nomsCategories = categoriesTexte.split(',').map((c) => c.trim()).filter((c) => c.length > 0);
      const categoriesToLink = [];
      for (const nomCat of nomsCategories) {
        const [cat] = await Category.findOrCreate({ where: { nom: nomCat } });
        categoriesToLink.push(cat.id);
      }
      await product.addCategories(categoriesToLink);
    }

    // Variantes (contenances) — arrays parallèles depuis le formulaire
    if (contenance_ml) {
      const contenances = Array.isArray(contenance_ml) ? contenance_ml : [contenance_ml];
      const prixArr = Array.isArray(prix) ? prix : [prix];
      const prixPromoArr = Array.isArray(prix_promo) ? prix_promo : [prix_promo];
      const stockArr = Array.isArray(stock) ? stock : [stock];

      const variantsToCreate = contenances
        .map((c, i) => ({
          contenance_ml: c,
          prix: prixArr[i],
          prix_promo: prixPromoArr[i] || null,
          stock: stockArr[i] || 0,
          productId: product.id,
        }))
        .filter((v) => v.contenance_ml && v.prix);

      if (variantsToCreate.length > 0) {
        await ProductVariant.bulkCreate(variantsToCreate);
      }
    }

    req.flash('success', `Le parfum "${nom}" a été ajouté avec succès.`);
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    req.flash('error', "Erreur lors de la création du produit : " + err.message);
    res.redirect('/admin/products/nouveau');
  }
};

// --- Formulaire d'édition ---
exports.showEdit = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Brand },
        { model: Category },
        { model: ProductVariant, as: 'variants' },
      ],
    });

    if (!product) {
      req.flash('error', 'Produit introuvable.');
      return res.redirect('/admin/products');
    }

    const brands = await Brand.findAll({ order: [['nom', 'ASC']] });

    res.render('admin/products/form', {
      title: 'Modifier le parfum',
      product,
      brands,
      errors: [],
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors du chargement du produit.');
    res.redirect('/admin/products');
  }
};

// --- Mise à jour ---
exports.update = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      req.flash('error', 'Produit introuvable.');
      return res.redirect('/admin/products');
    }

    const {
      nom, description, notes_tete, notes_coeur, notes_fond, genre,
      brandNom, categoriesTexte, actif,
      contenance_ml, prix, prix_promo, stock, variantId,
    } = req.body;

    let brandId = product.brandId;
    if (brandNom && brandNom.trim() !== '') {
      const [brand] = await Brand.findOrCreate({ where: { nom: brandNom.trim() } });
      brandId = brand.id;
    }

    // Nouvelle image ? On supprime l'ancienne
    let image_principale = product.image_principale;
    if (req.file) {
      if (product.image_principale) {
        const oldPath = path.join(__dirname, '../../public', product.image_principale);
        fs.unlink(oldPath, (err) => { if (err) console.error('Ancienne image non supprimée:', err.message); });
      }
      image_principale = `/uploads/products/${req.file.filename}`;
    }

    await product.update({
      nom,
      description,
      notes_tete,
      notes_coeur,
      notes_fond,
      genre,
      brandId,
      image_principale,
      actif: actif === 'on',
    });

    // Catégories à la volée
    let categoriesIds = [];
    if (categoriesTexte && categoriesTexte.trim() !== '') {
      const nomsCategories = categoriesTexte.split(',').map((c) => c.trim()).filter((c) => c.length > 0);
      for (const nomCat of nomsCategories) {
        const [cat] = await Category.findOrCreate({ where: { nom: nomCat } });
        categoriesIds.push(cat.id);
      }
    }
    await product.setCategories(categoriesIds);

    // Variantes : on remplace tout (simple et sûr pour un MVP)
    if (contenance_ml) {
      await ProductVariant.destroy({ where: { productId: product.id } });

      const contenances = Array.isArray(contenance_ml) ? contenance_ml : [contenance_ml];
      const prixArr = Array.isArray(prix) ? prix : [prix];
      const prixPromoArr = Array.isArray(prix_promo) ? prix_promo : [prix_promo];
      const stockArr = Array.isArray(stock) ? stock : [stock];

      const variantsToCreate = contenances
        .map((c, i) => ({
          contenance_ml: c,
          prix: prixArr[i],
          prix_promo: prixPromoArr[i] || null,
          stock: stockArr[i] || 0,
          productId: product.id,
        }))
        .filter((v) => v.contenance_ml && v.prix);

      if (variantsToCreate.length > 0) {
        await ProductVariant.bulkCreate(variantsToCreate);
      }
    }

    req.flash('success', `Le parfum "${nom}" a été mis à jour.`);
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors de la mise à jour : ' + err.message);
    res.redirect(`/admin/products/${req.params.id}/modifier`);
  }
};

// --- Suppression ---
exports.remove = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      req.flash('error', 'Produit introuvable.');
      return res.redirect('/admin/products');
    }

    if (product.image_principale) {
      const imgPath = path.join(__dirname, '../../public', product.image_principale);
      fs.unlink(imgPath, (err) => { if (err) console.error('Image non supprimée:', err.message); });
    }

    await product.destroy(); // cascade sur variants via FK si configuré, sinon on nettoie à la main
    await ProductVariant.destroy({ where: { productId: req.params.id } });

    req.flash('success', 'Produit supprimé.');
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors de la suppression : ' + err.message);
    res.redirect('/admin/products');
  }
};