const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const FOLDERS_TO_CONVERT = [
  path.join(__dirname, '../public/uploads/products'),
  path.join(__dirname, '../public/images'), // pour ton logo
];

async function convertFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    console.log(`⏭️  Dossier introuvable, ignoré : ${folderPath}`);
    return;
  }

  const files = fs.readdirSync(folderPath);
  let converted = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) continue;

    const fullPath = path.join(folderPath, file);
    const newName = file.replace(ext, '.webp');
    const newPath = path.join(folderPath, newName);

    try {
      await sharp(fullPath)
        .resize({ width: 1000, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(newPath);

      const originalSize = fs.statSync(fullPath).size;
      const newSize = fs.statSync(newPath).size;
      const reduction = Math.round((1 - newSize / originalSize) * 100);

      console.log(`✅ ${file} → ${newName} (${reduction}% plus léger)`);
      converted++;

      // On garde l'ancien fichier pour l'instant (sécurité), tu le supprimeras après vérification
    } catch (err) {
      console.error(`❌ Erreur sur ${file} :`, err.message);
    }
  }

  console.log(`\n${converted} image(s) converties dans ${folderPath}`);
}

async function run() {
  for (const folder of FOLDERS_TO_CONVERT) {
    await convertFolder(folder);
  }
  console.log('\n🎉 Conversion terminée. Vérifie visuellement les .webp avant de supprimer les anciens fichiers.');
}

run();