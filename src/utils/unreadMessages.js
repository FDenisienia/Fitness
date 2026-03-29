/** Dispara actualización de badges de no leídos en el layout (p. ej. tras enviar o leer mensajes). */
export function notifyUnreadRefresh() {
  window.dispatchEvent(new Event('athlento-unread-refresh'));
}

/**
 * Texto de aviso tras login cuando hay mensajes sin leer.
 */
export function formatLoginUnreadNotice(role, d) {
  const cc = d?.coachClientUnread ?? 0;
  const ac = d?.adminCoachUnread ?? 0;
  if (role === 'cliente') {
    return cc > 0 ? `Tienes ${cc} mensaje${cc === 1 ? '' : 's'} sin leer de tu coach.` : '';
  }
  if (role === 'coach') {
    const parts = [];
    if (cc > 0) parts.push(`${cc} con alumnos`);
    if (ac > 0) parts.push(`${ac} en soporte`);
    if (parts.length === 0) return '';
    return `Tienes mensajes sin leer: ${parts.join(' · ')}.`;
  }
  if (role === 'admin') {
    return ac > 0 ? `Tienes ${ac} consulta${ac === 1 ? '' : 's'} sin leer de coaches.` : '';
  }
  return '';
}

/** Número a mostrar en el badge del sidebar para una ruta concreta. */
export function unreadBadgeForNavPath(to, role, u) {
  if (!u) return 0;
  if (to === '/cliente/consultas' || to === '/coach/consultas') return u.coachClientUnread ?? 0;
  if (to === '/coach/soporte' || to === '/admin/consultas') return u.adminCoachUnread ?? 0;
  return 0;
}
