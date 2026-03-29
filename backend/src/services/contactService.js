import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { BadRequestError, ServiceUnavailableError } from '../utils/errors.js';

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isConfigured() {
  return !!(config.contactSmtpUser && config.contactSmtpPass);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactPayload(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const plan = typeof body?.plan === 'string' ? body.plan.trim().slice(0, 200) : '';

  if (!name || name.length > 120) throw new BadRequestError('Indica un nombre válido (máx. 120 caracteres).');
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    throw new BadRequestError('Indica un email válido.');
  }
  if (!message || message.length > 8000) {
    throw new BadRequestError('Escribí un mensaje (máx. 8000 caracteres).');
  }
  return { name, email, message, plan };
}

/**
 * Envía el formulario de contacto de la landing a CONTACT_MAIL_TO (por defecto athlento.app@gmail.com).
 * Requiere CONTACT_SMTP_USER y CONTACT_SMTP_PASS (p. ej. contraseña de aplicación de Gmail).
 */
export async function sendContactEmail({ name, email, message, plan }) {
  if (!isConfigured()) {
    throw new ServiceUnavailableError(
      'El envío de contacto no está configurado en el servidor. Definí CONTACT_SMTP_USER y CONTACT_SMTP_PASS.'
    );
  }

  const secure = config.contactSmtpPort === 465;
  const transporter = nodemailer.createTransport({
    host: config.contactSmtpHost,
    port: config.contactSmtpPort,
    secure,
    ...(!secure && { requireTLS: true }),
    auth: {
      user: config.contactSmtpUser,
      pass: config.contactSmtpPass,
    },
  });

  const planLine = plan ? `Plan de interés: ${plan}` : 'Plan de interés: (no indicado)';
  const text = [
    `Nuevo mensaje desde athlento.app (contacto web)`,
    '',
    `Nombre: ${name}`,
    `Email: ${email}`,
    planLine,
    '',
    'Mensaje:',
    message,
  ].join('\n');

  const html = `
    <p><strong>Nuevo mensaje desde la web Athlento</strong></p>
    <p><strong>Nombre:</strong> ${escHtml(name)}<br/>
    <strong>Email:</strong> <a href="mailto:${escHtml(email)}">${escHtml(email)}</a><br/>
    <strong>Plan:</strong> ${escHtml(plan || '—')}</p>
    <p><strong>Mensaje:</strong></p>
    <pre style="font-family:sans-serif;white-space:pre-wrap;">${escHtml(message)}</pre>
  `.trim();

  await transporter.sendMail({
    from: `"Athlento — contacto web" <${config.contactSmtpUser}>`,
    to: config.contactMailTo,
    replyTo: email,
    subject: `[Athlento] Contacto: ${name.slice(0, 60)}`,
    text,
    html,
  });
}
