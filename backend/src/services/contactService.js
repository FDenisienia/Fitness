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

function isSmtpConfigured() {
  return !!(config.contactSmtpUser && config.contactSmtpPass);
}

function isResendConfigured() {
  return !!(config.resendApiKey && config.contactResendFrom);
}

function isConfigured() {
  return isResendConfigured() || isSmtpConfigured();
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

function buildContactMailBodies({ name, email, message, plan }) {
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

  return { text, html };
}

async function sendContactViaResend({ name, email, message, plan }) {
  const { text, html } = buildContactMailBodies({ name, email, message, plan });
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Athlento — contacto web <${config.contactResendFrom}>`,
        to: [config.contactMailTo],
        reply_to: email,
        subject: `[Athlento] Contacto: ${name.slice(0, 60)}`,
        text,
        html,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail =
        (typeof data?.message === 'string' && data.message) ||
        (data?.error && typeof data.error === 'object' && data.error.message) ||
        res.statusText ||
        'Error desconocido';
      throw new ServiceUnavailableError(
        `Resend rechazó el envío (${res.status}): ${detail}. Revisá RESEND_API_KEY, CONTACT_RESEND_FROM (dominio verificado) y CONTACT_MAIL_TO.`
      );
    }
  } catch (e) {
    if (e instanceof ServiceUnavailableError) throw e;
    const msg = String(e?.message || e || '');
    if (/fetch failed|ENOTFOUND|ETIMEDOUT|ECONNREFUSED/i.test(msg)) {
      throw new ServiceUnavailableError(
        'No se pudo contactar a la API de Resend. Comprobá la red del servidor o probá más tarde.'
      );
    }
    throw new ServiceUnavailableError(`No se pudo enviar el correo vía Resend: ${msg}`);
  }
}

/**
 * Envía el formulario a CONTACT_MAIL_TO (o fallback). Orden: si hay RESEND_API_KEY + CONTACT_RESEND_FROM, usa Resend (recomendado en Railway); si no, SMTP con CONTACT_SMTP_*.
 */
export async function sendContactEmail({ name, email, message, plan }) {
  if (!isConfigured()) {
    throw new ServiceUnavailableError(
      'El envío de contacto no está configurado. En hosts como Railway usá RESEND_API_KEY y CONTACT_RESEND_FROM (API HTTPS), o definí CONTACT_SMTP_USER y CONTACT_SMTP_PASS si el host permite SMTP.'
    );
  }

  if (isResendConfigured()) {
    await sendContactViaResend({ name, email, message, plan });
    return;
  }

  const secure = config.contactSmtpPort === 465;
  const transporter = nodemailer.createTransport({
    host: config.contactSmtpHost,
    port: config.contactSmtpPort,
    secure,
    ...(!secure && { requireTLS: true }),
    connectionTimeout: 20_000,
    greetingTimeout: 15_000,
    socketTimeout: 25_000,
    auth: {
      user: config.contactSmtpUser,
      pass: config.contactSmtpPass,
    },
  });

  const { text, html } = buildContactMailBodies({ name, email, message, plan });

  try {
    await transporter.sendMail({
      from: `"Athlento — contacto web" <${config.contactSmtpUser}>`,
      to: config.contactMailTo,
      replyTo: email,
      subject: `[Athlento] Contacto: ${name.slice(0, 60)}`,
      text,
      html,
    });
  } catch (e) {
    const code = e?.code || e?.responseCode;
    const msg = String(e?.message || e || '');
    const isAuth =
      code === 'EAUTH' ||
      /Invalid login|authentication|^534|^535|BadCredentials|Username and Password not accepted|Application-specific password required/i.test(
        msg
      );
    const isNet =
      /ETIMEDOUT|ECONNREFUSED|ESOCKET|ECONNRESET|ENOTFOUND|getaddrinfo|timeout|socket|Greeting never received|ECONNRESET/i.test(
        msg
      );
    if (isAuth) {
      throw new ServiceUnavailableError(
        'No se pudo autenticar con el servidor de correo. Revisá CONTACT_SMTP_USER (email completo) y CONTACT_SMTP_PASS (contraseña de aplicación, sin espacios).'
      );
    }
    if (isNet) {
      throw new ServiceUnavailableError(
        'No se pudo conectar al servidor SMTP. En hosts como Railway el correo saliente por SMTP suele estar bloqueado en planes gratuitos; hace falta un plan que permita SMTP o un proveedor con API (Resend, SendGrid, etc.).'
      );
    }
    throw new ServiceUnavailableError(
      'No se pudo enviar el correo. Revisá la configuración SMTP o probá más tarde.'
    );
  }
}
