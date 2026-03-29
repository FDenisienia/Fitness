import '../loadEnv.js';

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const extraOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);

const rateLimitWindowMs = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000),
  10
);
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX || '400', 10);

const contactSmtpPort = parseInt(process.env.CONTACT_SMTP_PORT || '465', 10);

const DEV_JWT_PLACEHOLDER = 'dev-secret-change-me';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || DEV_JWT_PLACEHOLDER,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl,
  corsOrigins: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173', ...extraOrigins].filter(Boolean),
  rateLimitWindowMs: Number.isFinite(rateLimitWindowMs) ? rateLimitWindowMs : 15 * 60 * 1000,
  rateLimitMax: Number.isFinite(rateLimitMax) && rateLimitMax > 0 ? rateLimitMax : 400,
  /** Aplicar rate limit global /api también en desarrollo (útil con datos reales). */
  forceRateLimit:
    process.env.FORCE_RATE_LIMIT === '1' || String(process.env.FORCE_RATE_LIMIT).toLowerCase() === 'true',
  /** Formulario de contacto landing → bandeja (por defecto athlento.app@gmail.com) */
  contactMailTo: (process.env.CONTACT_MAIL_TO || 'athlento.app@gmail.com').trim(),
  contactSmtpHost: (process.env.CONTACT_SMTP_HOST || 'smtp.gmail.com').trim(),
  contactSmtpPort: Number.isFinite(contactSmtpPort) && contactSmtpPort > 0 ? contactSmtpPort : 465,
  contactSmtpUser: (process.env.CONTACT_SMTP_USER || '').trim(),
  contactSmtpPass: (process.env.CONTACT_SMTP_PASS || '').trim(),
};

/** Falla al arranque en producción si el JWT no está configurado de forma segura. */
export function validateProductionConfig() {
  if (config.nodeEnv !== 'production') return;
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret === DEV_JWT_PLACEHOLDER || secret.length < 32) {
    throw new Error(
      'En producción JWT_SECRET debe definirse con un valor aleatorio de al menos 32 caracteres (no uses el valor por defecto de desarrollo).'
    );
  }
}
