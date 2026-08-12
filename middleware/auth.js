// Vérifie que l'utilisateur est connecté (client ou admin)
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  req.flash('error', 'Veuillez vous connecter pour accéder à cette page.');
  res.redirect('/connexion');
}

// Vérifie que l'utilisateur est connecté ET qu'il est admin
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  req.flash('error', 'Accès réservé aux administrateurs.');
  res.redirect('/connexion');
}

// Empêche un utilisateur déjà connecté d'accéder à /connexion ou /inscription
function isGuest(req, res, next) {
  if (req.session.user) {
    return res.redirect('/');
  }
  next();
}

module.exports = { isAuthenticated, isAdmin, isGuest };