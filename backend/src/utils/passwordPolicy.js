import { BadRequestError } from './errors.js';

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Mínimo 8 caracteres, al menos una mayúscula y un dígito.
 */
export function assertPasswordPolicy(password) {
  if (typeof password !== 'string') {
    throw new BadRequestError('La contraseña es obligatoria');
  }
  const p = password;
  if (p.length < MIN_PASSWORD_LENGTH) {
    throw new BadRequestError(
      `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
    );
  }
  if (!/[A-ZÁÉÍÓÚÜÑ]/.test(p)) {
    throw new BadRequestError('La contraseña debe incluir al menos una letra mayúscula');
  }
  if (!/\d/.test(p)) {
    throw new BadRequestError('La contraseña debe incluir al menos un número');
  }
}
