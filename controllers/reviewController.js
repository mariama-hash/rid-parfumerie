const { Review, Product } = require('../models');

// --- Ajouter ou mettre à jour un avis ---
exports.create = async (req, res) => {
  try {
    const { productId, note, commentaire } = req.body;
    const rating = parseInt(note);

    if (!rating || rating < 1 || rating > 5) {
  req.flash('error', 'Merci de choisir une note entre 1 et 5.');
  return res.redirect('back');
}

if (commentaire && commentaire.length > 500) {
  req.flash('error', 'Le commentaire ne doit pas dépasser 500 caractères.');
  return res.redirect('back');
}

    const product = await Product.findByPk(productId);
    if (!product) {
      req.flash('error', 'Produit introuvable.');
      return res.redirect('/produits');
    }

    // Un avis par utilisateur par produit : on met à jour si déjà existant
    const existing = await Review.findOne({
      where: { userId: req.session.user.id, productId },
    });

    if (existing) {
      existing.note = rating;
      existing.commentaire = commentaire || null;
      await existing.save();
      req.flash('success', 'Ton avis a été mis à jour.');
    } else {
      await Review.create({
        userId: req.session.user.id,
        productId,
        note: rating,
        commentaire: commentaire || null,
      });
      req.flash('success', 'Merci pour ton avis !');
    }

    res.redirect(`/produits/${product.slug}#avis`);
  } catch (err) {
    console.error(err);
    req.flash('error', "Erreur lors de l'enregistrement de l'avis.");
    res.redirect('back');
  }
};

// --- Supprimer son propre avis ---
exports.remove = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id, { include: [Product] });

    if (!review) {
      req.flash('error', 'Avis introuvable.');
      return res.redirect('/produits');
    }

    if (review.userId !== req.session.user.id) {
      req.flash('error', 'Action non autorisée.');
      return res.redirect('back');
    }

    const slug = review.Product.slug;
    await review.destroy();

    req.flash('success', 'Ton avis a été supprimé.');
    res.redirect(`/produits/${slug}#avis`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Erreur lors de la suppression.');
    res.redirect('/produits');
  }
};