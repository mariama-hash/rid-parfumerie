require('./instrument.js');
require('dotenv').config();
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const cartRoutes = require('./routes/cartRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const shopRoutes = require('./routes/shopRoutes');
const homeController = require('./controllers/homeController');
const reviewRoutes = require('./routes/reviewRoutes');
const { sequelize } = require('./models');
const helmet = require('helmet');
const Sentry = require('@sentry/node');
const accountRoutes = require('./routes/accountRoutes');
const legalRoutes = require('./routes/legalRoutes');
const { getCartCount } = require('./controllers/cartController');

const app = express();

app.set('trust proxy', 1);

// --- Sécurité HTTP ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
}));

// --- Moteur de vues ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'partials/layout');

// --- Middlewares de base ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// --- Session + Flash ---
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24h
    httpOnly: true, // empêche le JS client de lire le cookie (anti-XSS)
    secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en prod
    sameSite: 'lax', // protection CSRF basique
  },
}));
app.use(flash());

// --- Variables globales pour les vues ---

app.use(async (req, res, next) => {
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  res.locals.user = req.session.user || null;
  res.locals.social = {
    tiktok: process.env.SOCIAL_TIKTOK,
    instagram: process.env.SOCIAL_INSTAGRAM,
    linkedin: process.env.SOCIAL_LINKEDIN,
  };
  res.locals.contact = {
    whatsapp: process.env.CONTACT_WHATSAPP,
    phoneDisplay: process.env.CONTACT_PHONE_DISPLAY,
    address: process.env.CONTACT_ADDRESS,
  };

  if (req.session.user) {
    try {
      res.locals.cartCount = await getCartCount(req.session.user.id);
    } catch (err) {
      res.locals.cartCount = 0;
    }
  } else {
    res.locals.cartCount = 0;
  }

  next();
});
// --- Routes ---
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/', shopRoutes);
app.use('/', cartRoutes);
app.use('/', checkoutRoutes);
app.use('/', reviewRoutes);
app.use('/', accountRoutes);
app.use('/', legalRoutes);



app.get('/', homeController.show);
// (les autres routes viendront ici : /produits, /panier, /admin, etc.)

// --- 404 ---
app.use((req, res) => {
  res.status(404).send('Page non trouvée');
});

// --- Sentry : capture automatique des erreurs Express ---
Sentry.setupExpressErrorHandler(app);

// --- Gestion d'erreurs globale ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (process.env.NODE_ENV === 'production') {
    res.status(500).render('error', { title: 'Erreur', message: 'Une erreur est survenue.' });
  } else {
    res.status(500).send(`<pre>${err.stack}</pre>`);
  }
});

// --- Démarrage ---
const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true })  .then(() => {
    console.log('✅ Base de données synchronisée');
    app.listen(PORT, () => {
      console.log(` Serveur démarré sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('  Erreur de synchronisation :', err.message);
  });