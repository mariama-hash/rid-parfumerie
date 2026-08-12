exports.mentions = (req, res) => {
  res.render('legal/mentions', { title: 'Mentions légales' });
};

exports.confidentialite = (req, res) => {
  res.render('legal/confidentialite', { title: 'Politique de confidentialité' });
};

exports.cgv = (req, res) => {
  res.render('legal/cgv', { title: 'Conditions générales de vente' });
};