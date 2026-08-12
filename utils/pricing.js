// Retourne le prix à afficher/facturer (promo si définie, sinon prix normal)
function getEffectivePrice(variant) {
  const prixPromo = variant.prix_promo ? parseFloat(variant.prix_promo) : null;
  const prixNormal = parseFloat(variant.prix);
  if (prixPromo !== null && prixPromo > 0 && prixPromo < prixNormal) {
    return prixPromo;
  }
  return prixNormal;
}

// Retourne le pourcentage de réduction (0 si pas de promo active)
function getDiscountPercent(variant) {
  const prixPromo = variant.prix_promo ? parseFloat(variant.prix_promo) : null;
  const prixNormal = parseFloat(variant.prix);
  if (prixPromo !== null && prixPromo > 0 && prixPromo < prixNormal) {
    return Math.round(((prixNormal - prixPromo) / prixNormal) * 100);
  }
  return 0;
}

module.exports = { getEffectivePrice, getDiscountPercent };