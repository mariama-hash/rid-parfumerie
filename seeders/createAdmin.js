require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../models');

async function createAdmin() {
  try {
    await sequelize.authenticate();

    const email = 'admin@ridparfumerie.com'; // change si tu veux
    const password = 'Admin123!'; // change après ta première connexion !

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log('⚠️ Un compte avec cet email existe déjà.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      nom: 'Admin',
      prenom: 'Rid',
      email,
      telephone: '90000000',
      password: hashedPassword,
      adresse: 'Siège Rid_Parfumerie',
      ville: 'Lomé',
      role: 'admin',
    });

    console.log('✅ Compte admin créé avec succès !');
    console.log(`   Email : ${email}`);
    console.log(`   Mot de passe : ${password}`);
    console.log('   ⚠️ Pense à changer ce mot de passe après ta première connexion.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors de la création de l\'admin :', err);
    process.exit(1);
  }
}

createAdmin();