import { prisma } from '../utils/prisma.js';
import { ForbiddenError, NotFoundError, BadRequestError } from '../utils/errors.js';

const PREVIEW_MAX = 120;

function preview(text) {
  const t = text.trim();
  if (t.length <= PREVIEW_MAX) return t;
  return `${t.slice(0, PREVIEW_MAX - 3)}...`;
}

function mapMessage(m) {
  return {
    id: m.id,
    senderId: m.senderId,
    senderRole: m.senderRole,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  };
}

function clampMessageLimit(raw, def = 200, max = 500) {
  if (raw == null || raw === '') return def;
  const n = parseInt(String(Array.isArray(raw) ? raw[0] : raw), 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(1, n));
}

async function getDefaultAdminUserId() {
  const admin = await prisma.user.findFirst({
    where: { role: 'admin', status: 'active' },
    orderBy: { createdAt: 'asc' },
  });
  if (!admin) throw new BadRequestError('No hay administrador en el sistema');
  return admin.id;
}

export async function getOrCreateConversationForCoach(coachUserId) {
  const coach = await prisma.coach.findUnique({
    where: { userId: coachUserId },
    include: { user: true },
  });
  if (!coach) throw new ForbiddenError('No eres coach');

  const adminId = await getDefaultAdminUserId();
  let conv = await prisma.adminCoachConversation.findFirst({
    where: { coachId: coach.id, adminId },
  });
  if (!conv) {
    conv = await prisma.adminCoachConversation.create({
      data: { coachId: coach.id, adminId },
    });
  }

  const adminUser = await prisma.user.findUnique({ where: { id: adminId } });
  return {
    id: conv.id,
    coachId: coach.id,
    adminId,
    coachUserId: coach.user.id,
    adminUserId: adminId,
    otherParticipant: {
      id: adminUser.id,
      name: adminUser.name,
      lastName: adminUser.lastName,
    },
    lastMessageAt: conv.lastMessageAt?.toISOString() ?? null,
    lastMessagePreview: conv.lastMessagePreview,
    adminUnreadCount: conv.adminUnreadCount,
    coachUnreadCount: conv.coachUnreadCount,
  };
}

export async function listConversationsForAdmin(adminUserId) {
  const convs = await prisma.adminCoachConversation.findMany({
    include: {
      coach: { include: { user: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
  });
  return convs.map((c) => ({
    id: c.id,
    coachId: c.coachId,
    adminId: c.adminId,
    coachUserId: c.coach.user.id,
    adminUserId: c.adminId,
    otherParticipant: {
      id: c.coach.user.id,
      name: c.coach.user.name,
      lastName: c.coach.user.lastName,
    },
    lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
    lastMessagePreview: c.lastMessagePreview,
    adminUnreadCount: c.adminUnreadCount,
    coachUnreadCount: c.coachUnreadCount,
  }));
}

async function assertAdminCoachAccess({ userId, role, conversationId }) {
  if (role === 'coach') {
    const coach = await prisma.coach.findUnique({ where: { userId } });
    if (!coach) throw new ForbiddenError('No eres coach');
    const conv = await prisma.adminCoachConversation.findFirst({
      where: { id: conversationId, coachId: coach.id },
    });
    if (!conv) throw new NotFoundError('Conversación');
    return { conv, coach };
  }
  if (role === 'admin') {
    const conv = await prisma.adminCoachConversation.findFirst({
      where: { id: conversationId, adminId: userId },
    });
    if (!conv) throw new NotFoundError('Conversación');
    return { conv, coach: null };
  }
  throw new ForbiddenError('Acceso denegado');
}

async function markRead(conv, role) {
  if (role === 'coach') {
    if (conv.coachUnreadCount === 0) return;
    await prisma.adminCoachConversation.update({
      where: { id: conv.id },
      data: { coachUnreadCount: 0 },
    });
  } else {
    if (conv.adminUnreadCount === 0) return;
    await prisma.adminCoachConversation.update({
      where: { id: conv.id },
      data: { adminUnreadCount: 0 },
    });
  }
}

export async function listMessages({ userId, role, conversationId, limit: limitRaw }) {
  const { conv } = await assertAdminCoachAccess({ userId, role, conversationId });
  await markRead(conv, role);
  const take = clampMessageLimit(limitRaw);

  const rows = await prisma.adminCoachChatMessage.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: 'desc' },
    take,
  });
  const messages = rows.reverse();
  return messages.map(mapMessage);
}

function validateContent(content) {
  if (typeof content !== 'string') throw new BadRequestError('Mensaje inválido');
  const text = content.trim();
  if (!text.length) throw new BadRequestError('El mensaje no puede estar vacío');
  if (text.length > 8000) throw new BadRequestError('El mensaje es demasiado largo');
  return text;
}

export async function sendMessage({ userId, role, conversationId, content }) {
  const text = validateContent(content);
  const { conv } = await assertAdminCoachAccess({ userId, role, conversationId });
  const senderRole = role === 'admin' ? 'admin' : 'coach';

  const msg = await prisma.$transaction(async (tx) => {
    const m = await tx.adminCoachChatMessage.create({
      data: {
        conversationId: conv.id,
        senderId: userId,
        senderRole,
        content: text,
      },
    });
    const incAdmin = senderRole === 'coach';
    await tx.adminCoachConversation.update({
      where: { id: conv.id },
      data: {
        lastMessageAt: m.createdAt,
        lastMessagePreview: preview(text),
        adminUnreadCount: incAdmin ? { increment: 1 } : undefined,
        coachUnreadCount: !incAdmin ? { increment: 1 } : undefined,
      },
    });
    return m;
  });

  return mapMessage(msg);
}
