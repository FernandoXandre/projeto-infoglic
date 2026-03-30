const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // Gmail SMTP com Senha de App
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    console.log(`\x1b[32m📧 E-mail configurado (Gmail): ${process.env.EMAIL_USER}\x1b[0m`);
  } else {
    // Fallback Ethereal — apenas para visualização, não entrega na caixa real
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`\x1b[33m⚠  Ethereal ativo (e-mails não chegam na caixa real). Configure EMAIL_USER e EMAIL_PASS no .env\x1b[0m`);
  }

  return transporter;
};

const enviarEmail = async ({ para, assunto, html }) => {
  const t = await getTransporter();
  const remetente = process.env.EMAIL_USER
    ? `"InfoGlic" <${process.env.EMAIL_USER}>`
    : '"InfoGlic" <noreply@infoglic.app>';

  const info = await t.sendMail({
    from: remetente,
    to: para,
    subject: assunto,
    html,
  });

  const resultado = { messageId: info.messageId };

  // Link de preview só existe no Ethereal
  if (!process.env.EMAIL_USER) {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`\x1b[33m📧 Preview Ethereal → ${previewUrl}\x1b[0m`);
    resultado.previewUrl = previewUrl;
  } else {
    console.log(`\x1b[32m📧 E-mail enviado para ${para}\x1b[0m`);
  }

  return resultado;
};

module.exports = { enviarEmail };
