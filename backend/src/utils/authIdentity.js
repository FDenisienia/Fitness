/**
 * Normalización e identidad de acceso: username único global, email solo coaches/admin.
 * Preparado para añadir login por email en el futuro sin romper el contrato actual.
 */

import { BadRequestError } from './errors.js';

/** a-z 0-9 _ - ; 3–32 caracteres (ampliar registro si hace falta). */
const USERNAME_PATTERN = /^[a-z0-9_-]{3,32}$/;

export function normalizeUsername(raw) {
  if (raw == null) return '';
  return String(raw).trim().toLowerCase();
}

export function assertValidUsernameShape(normalized) {
  if (!normalized || !USERNAME_PATTERN.test(normalized)) {
    throw new BadRequestError(
      'El usuario debe tener entre 3 y 32 caracteres (solo letras minúsculas, números, guion y guion bajo).'
    );
  }
}

/**
 * @param {string} normalizedUsername
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function rejectIfEmailShape(normalizedUsername) {
  if (normalizedUsername.includes('@')) {
    return {
      ok: false,
      message: 'Ingresá tu nombre de usuario, no tu correo electrónico.',
    };
  }
  return { ok: true };
}

export function normalizeCoachEmail(raw) {
  if (raw == null || String(raw).trim() === '') {
    throw new BadRequestError('El correo electrónico es obligatorio para coaches.');
  }
  return String(raw).trim().toLowerCase();
}

/** Email opcional en cliente: cadena vacía → null */
export function normalizeOptionalClientEmail(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase();
  return s === '' ? null : s;
}
