import { prisma } from '../utils/prisma.js';

/**
 * Contadores de mensajes no leídos para badges y notificaciones.
 */
export async function getUnreadSummary(userId, role) {
  if (role === 'cliente') {
    const client = await prisma.client.findUnique({
      where: { userId },
      select: { id: true, coachId: true },
    });
    if (!client) return { coachClientUnread: 0, adminCoachUnread: 0 };
    const conv = await prisma.conversation.findFirst({
      where: { clientId: client.id, coachId: client.coachId, messages: { some: {} } },
      select: { clientUnreadCount: true },
    });
    return {
      coachClientUnread: conv?.clientUnreadCount ?? 0,
      adminCoachUnread: 0,
    };
  }

  if (role === 'coach') {
    const coach = await prisma.coach.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!coach) return { coachClientUnread: 0, adminCoachUnread: 0 };
    const [agg, adminConv] = await Promise.all([
      prisma.conversation.aggregate({
        where: { coachId: coach.id, messages: { some: {} } },
        _sum: { coachUnreadCount: true },
      }),
      prisma.adminCoachConversation.findFirst({
        where: { coachId: coach.id },
        select: { coachUnreadCount: true },
      }),
    ]);
    return {
      coachClientUnread: agg._sum.coachUnreadCount ?? 0,
      adminCoachUnread: adminConv?.coachUnreadCount ?? 0,
    };
  }

  if (role === 'admin') {
    const agg = await prisma.adminCoachConversation.aggregate({
      where: { adminId: userId },
      _sum: { adminUnreadCount: true },
    });
    return {
      coachClientUnread: 0,
      adminCoachUnread: agg._sum.adminUnreadCount ?? 0,
    };
  }

  return { coachClientUnread: 0, adminCoachUnread: 0 };
}
