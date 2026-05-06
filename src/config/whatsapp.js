/**
 * URL base de WhatsApp (solo enlace wa.me). Opcional: VITE_WHATSAPP_URL en .env
 * Ejemplo: https://wa.me/34644636917
 */
export const WHATSAPP_BASE_URL =
  (import.meta.env.VITE_WHATSAPP_URL && String(import.meta.env.VITE_WHATSAPP_URL).trim()) ||
  'https://wa.me/34644636917';

/**
 * @param {string} [message] - Texto opcional pre-rellenado en WhatsApp
 */
export function whatsappUrl(message) {
  if (!message?.trim()) return WHATSAPP_BASE_URL;
  const u = new URL(WHATSAPP_BASE_URL);
  u.searchParams.set('text', message.trim());
  return u.toString();
}
