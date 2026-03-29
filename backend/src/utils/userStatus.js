/** Estados que impiden login y acceso con token (salvo mensajes específicos). */
export function isUserBlocked(status) {
  return status !== 'active';
}
