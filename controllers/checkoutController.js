const { Cart, CartItem, ProductVariant, Product, Order, OrderItem, Payment, sequelize } = require('../models');
const { getEffectivePrice } = require('../utils/pricing');
const { sendMail } = require('../utils/mailer');
const { orderConfirmationEmail, newOrderAdminEmail } = require('../utils/emailTemplates');
// Génère un numéro de commande unique
function generateOrderNumber() {
    const date = new Date();
    const y = date.getFullYear().toString().slice(-2);
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `RID-${y}${m}${d}-${rand}`;
}

// --- Affichage de la page checkout ---
exports.show = async (req, res) => {
    try {
        const cart = await Cart.findOne({ where: { userId: req.session.user.id } });

        if (!cart) {
            req.flash('error', 'Ton panier est vide.');
            return res.redirect('/panier');
        }

        const items = await CartItem.findAll({
            where: { cartId: cart.id },
            include: [{ model: ProductVariant, include: [Product] }],
        });

        if (items.length === 0) {
            req.flash('error', 'Ton panier est vide.');
            return res.redirect('/panier');
        }

        let total = 0;
        const itemsWithDetails = items.map((item) => {
            const prixUnitaire = getEffectivePrice(item.ProductVariant);
            const sousTotal = prixUnitaire * item.quantite;
            total += sousTotal;
            return { ...item.toJSON(), sousTotal, prixUnitaire };
        });

        res.render('shop/checkout', {
            title: 'Finaliser la commande',
            items: itemsWithDetails,
            total,
            user: req.session.user,
            paymentInfo: {
                floozNumber: process.env.FLOOZ_NUMBER,
                floozName: process.env.FLOOZ_NAME,
                tmoneyNumber: process.env.TMONEY_NUMBER,
                tmoneyName: process.env.TMONEY_NAME,
            },
            errors: [],
            old: {},
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Erreur lors du chargement de la commande.');
        res.redirect('/panier');
    }
};

// --- Traitement de la commande ---
exports.process = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const {
            adresse_livraison, ville_livraison, telephone_contact, notes,
            mode_paiement, numero_expediteur, reference_transaction,
        } = req.body;
        const numeroExpediteurSafe = Array.isArray(numero_expediteur) ? numero_expediteur[0] : numero_expediteur;
        const referenceSafe = Array.isArray(reference_transaction) ? reference_transaction[0] : reference_transaction;

        // --- Validation basique ---
        if (!adresse_livraison || !ville_livraison || !telephone_contact || !mode_paiement) {
            await t.rollback();
            req.flash('error', 'Merci de remplir tous les champs obligatoires.');
            return res.redirect('/commande');
        }

        if ((mode_paiement === 'flooz' || mode_paiement === 'tmoney') && !req.file) {
            await t.rollback();
            req.flash('error', 'Merci de joindre une capture d\'écran de ta transaction.');
            return res.redirect('/commande');
        }

        if ((mode_paiement === 'flooz' || mode_paiement === 'tmoney') && !referenceSafe) {
            await t.rollback();
            req.flash('error', 'Merci de renseigner la référence de ta transaction.');
            return res.redirect('/commande');
        }

        const cart = await Cart.findOne({ where: { userId: req.session.user.id } });
        const items = await CartItem.findAll({
            where: { cartId: cart.id },
            include: [{ model: ProductVariant, include: [Product] }],
            transaction: t,
        });

        if (items.length === 0) {
            await t.rollback();
            req.flash('error', 'Ton panier est vide.');
            return res.redirect('/panier');
        }

        // --- Vérification du stock avant de valider ---
        for (const item of items) {
            if (item.quantite > item.ProductVariant.stock) {
                await t.rollback();
                req.flash('error', `Stock insuffisant pour ${item.ProductVariant.Product.nom}. Il reste ${item.ProductVariant.stock} unité(s).`);
                return res.redirect('/panier');
            }
        }

        // --- Calcul du total (prix promo pris en compte) ---
        const total = items.reduce((sum, item) => sum + (getEffectivePrice(item.ProductVariant) * item.quantite), 0);

        // --- Création de la commande ---
        const order = await Order.create({
            numero_commande: generateOrderNumber(),
            userId: req.session.user.id,
            statut: 'en_attente',
            total,
            mode_paiement: mode_paiement === 'livraison' ? 'livraison' : 'mobile_money',
            adresse_livraison,
            ville_livraison,
            telephone_contact,
            notes: notes || null,
        }, { transaction: t });

        // --- Création des lignes de commande + décrément du stock ---
        for (const item of items) {
            await OrderItem.create({
                orderId: order.id,
                productVariantId: item.productVariantId,
                quantite: item.quantite,
                prix_unitaire: getEffectivePrice(item.ProductVariant),
            }, { transaction: t });

            await ProductVariant.decrement('stock', {
                by: item.quantite,
                where: { id: item.productVariantId },
                transaction: t,
            });
        }

        // --- Création du paiement ---
        await Payment.create({
            orderId: order.id,
            mode: mode_paiement, // 'flooz', 'tmoney' ou 'livraison'
            numero_expediteur: numeroExpediteurSafe || null,
            reference_transaction: referenceSafe || null,
            capture_ecran: req.file ? `/uploads/payments/${req.file.filename}` : null,
            statut: 'en_attente',
        }, { transaction: t });

        // --- Vidage du panier ---
        await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });

        await t.commit();

        // --- Email de confirmation à la cliente ---
        sendMail({
            to: req.session.user.email,
            subject: `Confirmation de ta commande ${order.numero_commande}`,
            html: orderConfirmationEmail(order, items),
        });

        // --- Notification à l'admin ---
        if (process.env.ADMIN_NOTIFY_EMAIL) {
            sendMail({
                to: process.env.ADMIN_NOTIFY_EMAIL,
                subject: `🆕 Nouvelle commande ${order.numero_commande}`,
                html: newOrderAdminEmail(order, items, req.session.user),
            });
        }

        req.flash('success', 'Ta commande a bien été enregistrée !');
        res.redirect(`/commande/confirmation/${order.id}`);
    } catch (err) {
        await t.rollback();
        console.error(err);
        req.flash('error', 'Erreur lors de la validation de la commande : ' + err.message);
        res.redirect('/commande');
    }
};

// --- Page de confirmation ---
exports.confirmation = async (req, res) => {
    try {
        const order = await Order.findOne({
            where: { id: req.params.id, userId: req.session.user.id },
            include: [
                { model: OrderItem, as: 'items', include: [{ model: ProductVariant, include: [Product] }] },
                { model: Payment },
            ],
        });

        if (!order) {
            req.flash('error', 'Commande introuvable.');
            return res.redirect('/produits');
        }

        res.render('shop/confirmation', { title: 'Commande confirmée', order });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Erreur lors du chargement de la confirmation.');
        res.redirect('/produits');
    }
};