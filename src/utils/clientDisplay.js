/**
 * Utilidades para mostrar datos de clientes/usuarios.
 */

/** Obtiene { name, lastName } de un cliente (soporta user anidado). */
export function clientDisplay(c) {
  const u = c?.user || c;
  return { name: u?.name ?? '', lastName: u?.lastName ?? '' };
}

/** Formatea nombre completo para display. */
export function clientDisplayName(c) {
  const d = clientDisplay(c);
  return `${d.name} ${d.lastName}`.trim() || 'Sin nombre';
}

/** Obtiene iniciales para avatares (máx 2 caracteres). */
export function getInitials(name, lastName) {
  return [name?.[0] || '', lastName?.[0] || ''].filter(Boolean).join('').toUpperCase().slice(0, 2) || '?';
}
