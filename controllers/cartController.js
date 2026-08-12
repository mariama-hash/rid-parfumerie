const { Cart, CartItem, ProductVariant, Product, Brand } = require('../models');
const { getEffectivePrice } = require('../utils/pricing');

// Récupère (ou crée) le panier de l'utilisateur connecté
async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ where: { userId } });
  if (!cart) {
    cart = await Cart.create({ userId });
  }
  return cart;
}
// Compte le nombre total d'articles dans le panier (toutes quantités confondues)
async function getCartCount(userId) {
  const cart = await Cart.findOne({ where: { userId } });
  if (!cart) return 0;
  const items = await CartItem.findAll({ where: { cartId: cart.id } });
  return items.reduce((sum, item) => sum + item.quantite, 0);
}

module.exports.getCartCount = getCartCount;


// --- Affichage du panier ---
exports.show = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.session.user.id);

    const items = await CartItem.findAll({
      where: { cartId: cart.id },
      include: [{
        model: ProductVariant,
        include: [{ model: Product, include: [Brand] }],
      }],
    });

    let total = 0;
    const itemsWithDetails = items.map((item) => {
      const prixUnitaire = getEffectivePrice(item.ProductVariant);
      const sousTotal = prixUnitaire * item.quantite;
      total += sousTotal;
      return { ...item.toJSON(), sousTotal, prixUnitaire };
    });

    res.render('shop/cart', { title: 'Mon panier', items: itemsWithDetails, total });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors du chargement du panier.');
    res.redirect('/');
  }
};

// --- Ajouter au panier ---
exports.add = async (req, res) => {
  try {
    const { productId, variantId, quantite } = req.body;
    const qty = parseInt(quantite) || 1;

    const variant = await ProductVariant.findByPk(variantId, { include: [Product] });
    if (!variant) {
      req.flash('error', 'Cette contenance est introuvable.');
      return res.redirect('back');
    }

    if (variant.stock < qty) {
      req.flash('error', `Stock insuffisant. Il ne reste que ${variant.stock} unité(s).`);
      return res.redirect('back');
    }

    const cart = await getOrCreateCart(req.session.user.id);

    // Si la même variante est déjà dans le panier, on incrémente
    let cartItem = await CartItem.findOne({ where: { cartId: cart.id, productVariantId: variantId } });

    if (cartItem) {
      const newQty = cartItem.quantite + qty;
      if (newQty > variant.stock) {
        req.flash('error', `Stock insuffisant. Il ne reste que ${variant.stock} unité(s), tu en as déjà ${cartItem.quantite} dans le panier.`);
        return res.redirect('back');
      }
      cartItem.quantite = newQty;
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({ cartId: cart.id, productVariantId: variantId, quantite: qty });
    }

    req.flash('success', `${variant.Product.nom} ajouté au panier.`);
    res.redirect('/panier');
  } catch (err) {
    console.error(err);
    req.flash('error', "Erreur lors de l'ajout au panier.");
    res.redirect('/produits');
  }
};

// --- Modifier la quantité ---
exports.updateQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantite } = req.body;
    const qty = parseInt(quantite);

    const cartItem = await CartItem.findByPk(itemId, { include: [ProductVariant] });
    if (!cartItem) {
      req.flash('error', 'Article introuvable.');
      return res.redirect('/panier');
    }

    // Vérifie que ce panier appartient bien à l'utilisateur connecté
    const cart = await Cart.findByPk(cartItem.cartId);
    if (cart.userId !== req.session.user.id) {
      req.flash('error', 'Action non autorisée.');
      return res.redirect('/panier');
    }

    if (qty < 1) {
      await cartItem.destroy();
      req.flash('success', 'Article retiré du panier.');
      return res.redirect('/panier');
    }

    if (qty > cartItem.ProductVariant.stock) {
      req.flash('error', `Stock insuffisant. Il ne reste que ${cartItem.ProductVariant.stock} unité(s).`);
      return res.redirect('/panier');
    }

    cartItem.quantite = qty;
    await cartItem.save();

    res.redirect('/panier');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors de la mise à jour.');
    res.redirect('/panier');
  }
};

// --- Supprimer un article ---
exports.removeItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cartItem = await CartItem.findByPk(itemId);

    if (cartItem) {
      const cart = await Cart.findByPk(cartItem.cartId);
      if (cart.userId === req.session.user.id) {
        await cartItem.destroy();
        req.flash('success', 'Article retiré du panier.');
      }
    }

    res.redirect('/panier');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors de la suppression.');
    res.redirect('/panier');
  }
};