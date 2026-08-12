const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

// Multer stocke temporairement en mémoire, puis Sharp convertit et écrit le fichier final
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = allowedTypes.test(file.mimetype);

  if (extValid && mimeValid) {
    return cb(null, true);
  }
  cb(new Error('Seules les images JPEG, JPG, PNG ou WEBP sont autorisées.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 Mo max en entrée (avant compression)
});

// Middleware à utiliser APRÈS upload.single('image') : convertit le buffer en WebP et l'écrit sur disque
async function convertToWebP(req, res, next) {
  if (!req.file) return next();

  try {
    const destDir = path.join(__dirname, '../public/uploads/products');
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const filename = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    const filepath = path.join(destDir, filename);

    await sharp(req.file.buffer)
      .resize({ width: 1000, withoutEnlargement: true }) // limite la taille max, évite les photos énormes
      .webp({ quality: 80 })
      .toFile(filepath);

    req.file.filename = filename; // pour que le reste du code (productController) fonctionne sans changement
    next();
  } catch (err) {
    console.error('Erreur conversion image :', err);
    next(err);
  }
}

module.exports = { upload, convertToWebP };