const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

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

const uploadPayment = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
});

async function convertPaymentToWebP(req, res, next) {
  if (!req.file) return next();

  try {
    const destDir = path.join(__dirname, '../public/uploads/payments');
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const filename = `payment-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    const filepath = path.join(destDir, filename);

    await sharp(req.file.buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(filepath);

    req.file.filename = filename;
    next();
  } catch (err) {
    console.error('Erreur conversion preuve de paiement :', err);
    next(err);
  }
}

module.exports = { uploadPayment, convertPaymentToWebP };