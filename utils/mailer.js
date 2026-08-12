const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  connectionTimeout: 15000,
});

// Vérifie la connexion au démarrage (utile pour déboguer une mauvaise config)
transporter.verify((err) => {
  if (err) {
    console.error('❌ Erreur configuration email :', err.message);
  } else {
    console.log('✅ Service email prêt');
  }
});

async function sendMail({ to, subject, html }, attempt = 1) {
  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error(`❌ Erreur envoi email (tentative ${attempt}) :`, err.message);
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 2000));
      return sendMail({ to, subject, html }, attempt + 1);
    }
    return false;
  }
}

module.exports = { sendMail };