/** Alineado con backend `assertPasswordPolicy` */
export function getPasswordPolicyError(password) {
  if (password == null || typeof password !== 'string') {
    return 'Indica una contraseña';
  }
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  if (!/[A-ZÁÉÍÓÚÜÑ]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra mayúscula';
  }
  if (!/\d/.test(password)) {
    return 'La contraseña debe incluir al menos un número';
  }
  return null;
}

export function validatePasswordPair(password, confirmPassword) {
  const p = getPasswordPolicyError(password);
  if (p) return p;
  if (password !== confirmPassword) {
    return 'Las contraseñas no coinciden';
  }
  return null;
}
