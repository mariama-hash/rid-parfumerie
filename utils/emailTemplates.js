function baseTemplate(content) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #F6EFE6; padding: 32px;">
      <div style="background: #1B0F14; padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: #EFD9A0; font-size: 24px; margin: 0; font-family: Georgia, serif;">Rid_Parfumerie</h1>
      </div>
      <div style="background: #FFFDF9; padding: 32px; border-radius: 0 0 10px 10px;">
        ${content}
      </div>
      <p style="text-align: center; color: #8A7568; font-size: 12px; margin-top: 20px;">
        Rid_Parfumerie — Lomé, Togo
      </p>
    </div>
  `;
}

function orderConfirmationEmail(order, items) {
  const itemsHtml = items.map((item) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #E3D5C6;">${item.ProductVariant.Product.nom} (${item.ProductVariant.contenance_ml}ml) × ${item.quantite}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #E3D5C6; text-align: right;">${(parseFloat(item.prix_unitaire) * item.quantite).toLocaleString('fr-FR')} FCFA</td>
    </tr>
  `).join('');

  const content = `
    <h2 style="color: #6B1E3C;">Merci pour ta commande !</h2>
    <p>Ta commande <strong>${order.numero_commande}</strong> a bien été enregistrée et est en attente de confirmation.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      ${itemsHtml}
      <tr>
        <td style="padding: 12px 0; font-weight: bold;">Total</td>
        <td style="padding: 12px 0; font-weight: bold; text-align: right; color: #6B1E3C;">${parseFloat(order.total).toLocaleString('fr-FR')} FCFA</td>
      </tr>
    </table>
    <p><strong>Livraison :</strong> ${order.adresse_livraison}, ${order.ville_livraison}</p>
    <p>Tu recevras un email dès que ta commande sera confirmée.</p>
  `;
  return baseTemplate(content);
}

function statusUpdateEmail(order, statusLabel) {
  const content = `
    <h2 style="color: #6B1E3C;">Mise à jour de ta commande</h2>
    <p>Ta commande <strong>${order.numero_commande}</strong> est maintenant :</p>
    <p style="font-size: 20px; font-weight: bold; color: #C9992F;">${statusLabel}</p>
    <p>Tu peux suivre le détail de ta commande dans ton espace "Mes commandes" sur le site.</p>
  `;
  return baseTemplate(content);
}

function paymentStatusEmail(order, validated) {
  const content = validated
    ? `
      <h2 style="color: #3F7D58;">Paiement validé ✓</h2>
      <p>Le paiement de ta commande <strong>${order.numero_commande}</strong> a bien été vérifié et validé.</p>
      <p>Ta commande va maintenant être préparée.</p>
    `
    : `
      <h2 style="color: #B23A3A;">Paiement non validé</h2>
      <p>Nous n'avons pas pu valider le paiement de ta commande <strong>${order.numero_commande}</strong>.</p>
      <p>Merci de nous contacter pour régulariser ta commande.</p>
    `;
  return baseTemplate(content);
}

function newOrderAdminEmail(order, items, user) {
  const itemsHtml = items.map((item) => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #E3D5C6;">${item.ProductVariant.Product.nom} (${item.ProductVariant.contenance_ml}ml) × ${item.quantite}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #E3D5C6; text-align: right;">${(parseFloat(item.prix_unitaire) * item.quantite).toLocaleString('fr-FR')} FCFA</td>
    </tr>
  `).join('');

  const content = `
    <h2 style="color: #6B1E3C;">Nouvelle commande reçue</h2>
    <p><strong>${order.numero_commande}</strong> — ${user.prenom} ${user.nom} (${user.email})</p>
    <p><strong>Mode de paiement :</strong> ${order.mode_paiement}</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      ${itemsHtml}
      <tr>
        <td style="padding: 12px 0; font-weight: bold;">Total</td>
        <td style="padding: 12px 0; font-weight: bold; text-align: right; color: #6B1E3C;">${parseFloat(order.total).toLocaleString('fr-FR')} FCFA</td>
      </tr>
    </table>
    <p><strong>Livraison :</strong> ${order.adresse_livraison}, ${order.ville_livraison}</p>
    <p><strong>Téléphone :</strong> ${order.telephone_contact}</p>
    <p style="margin-top: 20px;">
      <a href="http://localhost:3000/admin/orders/${order.id}" style="background: #C9992F; color: #1B0F14; padding: 10px 20px; border-radius: 999px; text-decoration: none; font-weight: bold;">Voir la commande</a>
    </p>
  `;
  return baseTemplate(content);
}

module.exports = { orderConfirmationEmail, statusUpdateEmail, paymentStatusEmail, newOrderAdminEmail };