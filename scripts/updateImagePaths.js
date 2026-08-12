require('dotenv').config();
const { sequelize, Product } = require('../models');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base réussie\n');

    const products = await Product.findAll();
    let updated = 0;
    let skipped = 0;

    for (const product of products) {
      if (!product.image_principale) continue;

      const ext = path.extname(product.image_principale);
      if (ext === '.webp') continue; // déjà à jour

      const webpPath = product.image_principale.replace(ext, '.webp');
      const webpFullPath = path.join(__dirname, '../public', webpPath);

      if (fs.existsSync(webpFullPath)) {
        await product.update({ image_principale: webpPath });
        console.log(`✅ ${product.nom} → ${webpPath}`);
        updated++;
      } else {
        console.log(`⚠️  Pas de .webp trouvé pour ${product.nom} (${product.image_principale}), ignoré`);
        skipped++;
      }
    }

    console.log(`\n🎉 Terminé : ${updated} produit(s) mis à jour, ${skipped} ignoré(s).`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur :', err);
    process.exit(1);
  }
}

run();