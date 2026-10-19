const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Genera un código numérico de 6 dígitos para 2FA
 */
function generateTwoFACode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Envía el código de verificación 2FA por email
 */
async function sendTwoFACode(email, code) {
  const mailOptions = {
    from: `"DENTALIS" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Código de verificación - DENTALIS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
        <h2 style="color: #2563eb;">DENTALIS</h2>
        <p>Tu código de verificación es:</p>
        <h1 style="font-size: 2rem; letter-spacing: 0.5rem; color: #1e40af;">${code}</h1>
        <p style="color: #6b7280;">Este código expira en <strong>10 minutos</strong>.</p>
        <p style="color: #6b7280; font-size: 0.85rem;">
          Si no solicitaste este código, ignorá este mensaje.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { generateTwoFACode, sendTwoFACode };
