/**
 * Tipos de conversación en UI (clasificación inteligente).
 */
export const CONVERSATION_KIND = {
  CLIENT_TO_COACH: 'client_to_coach',
  COACH_TO_ADMIN: 'coach_to_admin',
};

export function inferConversationKind(variant, viewerRole) {
  if (variant === 'admin-coach') return CONVERSATION_KIND.COACH_TO_ADMIN;
  if (variant === 'coach-client' && viewerRole === 'cliente') return CONVERSATION_KIND.CLIENT_TO_COACH;
  return CONVERSATION_KIND.CLIENT_TO_COACH;
}

export function contextBadgeLabel(kind, viewerRole) {
  if (kind === CONVERSATION_KIND.COACH_TO_ADMIN) {
    if (viewerRole === 'admin') return 'Soporte de coach';
    return 'Incidencia administrativa';
  }
  if (viewerRole === 'cliente') return 'Consulta con tu coach';
  return 'Consulta de cliente';
}

export function roleLabelForOther(otherRole) {
  const m = {
    cliente: 'Cliente',
    coach: 'Coach',
    admin: 'Administración',
  };
  return m[otherRole] || 'Usuario';
}
