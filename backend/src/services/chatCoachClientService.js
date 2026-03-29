import { prisma } from '../utils/prisma.js';
import { ForbiddenError, NotFoundError, BadRequestError } from '../utils/errors.js';

const PREVIEW_MAX = 120;

function preview(text) {
  const t = text.trim();
  if (t.length <= PREVIEW_MAX) return t;
  return `${t.slice(0, PREVIEW_MAX - 3)}...`;
}

function normalizeId(val) {
  if (val == null || val === '') return undefined;
  const v = Array.isArray(val) ? val[0] : val;
  if (v == null || v === '') return undefined;
  return String(v).trim();
}

function clampMessageLimit(raw, def = 200, max = 500) {
  if (raw == null || raw === '') return def;
  const n = parseInt(String(Array.isArray(raw) ? raw[0] : raw), 10);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(1, n));
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

async function getCoachByUserId(userId) {
  const coach = await prisma.coach.findUnique({
    where: { userId },
    include: { user: true },
  });
  if (!coach) throw new ForbiddenError('No eres coach');
  return coach;
}

async function getClientByUserId(userId) {
  const client = await prisma.client.findUnique({
    where: { userId },
    include: {
      user: true,
      coach: { include: { user: true } },
    },
  });
  if (!client) throw new ForbiddenError('No eres cliente');
  return client;
}

export async function getOrCreateConversation(clientId, coachId) {
  return prisma.conversation.upsert({
    where: { coachId_clientId: { coachId, clientId } },
    create: { clientId, coachId },
    update: {},
  });
}

/** Cliente: solo si existe al menos un mensaje (no crea conversación vacía). */
export async function getMyConversationClient(userId) {
  const client = await getClientByUserId(userId);
  const conv = await prisma.conversation.findFirst({
    where: {
      clientId: client.id,
      coachId: client.coachId,
      messages: { some: {} },
    },
  });
  if (!conv) return null;
  const coachUser = client.coach.user;
  return {
    id: conv.id,
    clientId: client.id,
    coachId: client.coachId,
    coachUserId: coachUser.id,
    clientUserId: client.user.id,
    otherParticipant: {
      id: coachUser.id,
      name: coachUser.name,
      lastName: coachUser.lastName,
    },
    lastMessageAt: conv.lastMessageAt?.toISOString() ?? null,
    lastMessagePreview: conv.lastMessagePreview,
    clientUnreadCount: conv.clientUnreadCount,
    coachUnreadCount: conv.coachUnreadCount,
  };
}

/**
 * Coach: todos los alumnos del coach en bandeja; los que aún no tienen mensajes
 * aparecen sin conversación hasta el primer envío (el envío hace upsert como siempre).
 */
export async function listInboxForCoach(userId) {
  const coach = await getCoachByUserId(userId);
  const [clients, convsWithMessages] = await Promise.all([
    prisma.client.findMany({
      where: { coachId: coach.id },
      include: { user: true },
    }),
    prisma.conversation.findMany({
      where: {
        coachId: coach.id,
        messages: { some: {} },
      },
      include: {
        client: { include: { user: true } },
      },
    }),
  ]);

  const convByClientId = new Map(convsWithMessages.map((c) => [c.clientId, c]));

  const rows = clients.map((client) => {
    const conv = convByClientId.get(client.id);
    const u = client.user;
    if (conv) {
      return {
        clientId: conv.clientId,
        clientUserId: conv.client.user.id,
        otherParticipant: {
          id: conv.client.user.id,
          name: conv.client.user.name,
          lastName: conv.client.user.lastName,
        },
        conversationId: conv.id,
        lastMessageAt: conv.lastMessageAt?.toISOString() ?? null,
        lastMessagePreview: conv.lastMessagePreview,
        clientUnreadCount: conv.clientUnreadCount,
        coachUnreadCount: conv.coachUnreadCount,
      };
    }
    return {
      clientId: client.id,
      clientUserId: u.id,
      otherParticipant: {
        id: u.id,
        name: u.name,
        lastName: u.lastName,
      },
      conversationId: null,
      lastMessageAt: null,
      lastMessagePreview: null,
      clientUnreadCount: 0,
      coachUnreadCount: 0,
    };
  });

  rows.sort((a, b) => {
    const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    if (ta !== tb) return tb - ta;
    const nameA = [a.otherParticipant?.name, a.otherParticipant?.lastName].filter(Boolean).join(' ').toLowerCase();
    const nameB = [b.otherParticipant?.name, b.otherParticipant?.lastName].filter(Boolean).join(' ').toLowerCase();
    return nameA.localeCompare(nameB, 'es');
  });

  return rows;
}

async function resolveCoachConversationForList(userId, rawConversationId, rawClientId) {
  const conversationId = normalizeId(rawConversationId);
  const clientId = normalizeId(rawClientId);
  const coach = await getCoachByUserId(userId);

  if (conversationId) {
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, coachId: coach.id, messages: { some: {} } },
    });
    if (!conv) throw new NotFoundError('Conversación');
    return conv;
  }

  if (clientId) {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundError('Cliente');
    if (client.coachId !== coach.id) {
      throw new ForbiddenError('No puedes enviar mensajes a este alumno');
    }
    return prisma.conversation.findFirst({
      where: { coachId: coach.id, clientId: client.id, messages: { some: {} } },
    });
  }

  throw new BadRequestError('Indica clientId o conversationId');
}

/** Marca como leídos los mensajes del lado que abre el listado. */
async function markConversationRead(conv, role) {
  if (role === 'cliente') {
    if (conv.clientUnreadCount === 0) return;
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { clientUnreadCount: 0 },
    });
  } else {
    if (conv.coachUnreadCount === 0) return;
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { coachUnreadCount: 0 },
    });
  }
}

export async function listMessages({ userId, role, conversationId, clientId, limit: limitRaw }) {
  const take = clampMessageLimit(limitRaw);
  let conv;
  if (role === 'cliente') {
    const client = await getClientByUserId(userId);
    const cid = normalizeId(conversationId);
    if (cid) {
      conv = await prisma.conversation.findFirst({
        where: { id: cid, clientId: client.id, messages: { some: {} } },
      });
    } else {
      conv = await prisma.conversation.findFirst({
        where: {
          clientId: client.id,
          coachId: client.coachId,
          messages: { some: {} },
        },
      });
    }
    if (!conv) {
      return [];
    }
  } else {
    conv = await resolveCoachConversationForList(userId, conversationId, clientId);
    if (!conv) {
      return [];
    }
  }

  await markConversationRead(conv, role);

  const rows = await prisma.chatMessage.findMany({
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

export async function sendMessage({ userId, role, conversationId, clientId, content }) {
  const text = validateContent(content);
  const convConversationId = normalizeId(conversationId);
  const convClientId = normalizeId(clientId);

  if (role === 'cliente') {
    const client = await getClientByUserId(userId);
    const msg = await prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.upsert({
        where: { coachId_clientId: { coachId: client.coachId, clientId: client.id } },
        create: { clientId: client.id, coachId: client.coachId },
        update: {},
      });
      const m = await tx.chatMessage.create({
        data: {
          conversationId: conv.id,
          senderId: userId,
          senderRole: 'cliente',
          content: text,
        },
      });
      await tx.conversation.update({
        where: { id: conv.id },
        data: {
          lastMessageAt: m.createdAt,
          lastMessagePreview: preview(text),
          coachUnreadCount: { increment: 1 },
        },
      });
      return m;
    });
    return mapMessage(msg);
  }

  if (!convClientId && !convConversationId) {
    throw new BadRequestError('Indica clientId o conversationId');
  }

  const msg = await prisma.$transaction(async (tx) => {
    const coachRow = await tx.coach.findUnique({ where: { userId } });
    if (!coachRow) throw new ForbiddenError('No eres coach');

    let conv;

    if (convClientId && convConversationId) {
      const client = await tx.client.findUnique({ where: { id: convClientId } });
      if (!client) throw new NotFoundError('Cliente');
      if (client.coachId !== coachRow.id) {
        throw new ForbiddenError('No puedes enviar mensajes a este alumno');
      }
      conv = await tx.conversation.findFirst({
        where: {
          id: convConversationId,
          coachId: coachRow.id,
          clientId: client.id,
        },
      });
      if (!conv) {
        throw new ForbiddenError('La conversación no corresponde a este alumno');
      }
    } else if (convClientId) {
      const client = await tx.client.findUnique({ where: { id: convClientId } });
      if (!client) throw new NotFoundError('Cliente');
      if (client.coachId !== coachRow.id) {
        throw new ForbiddenError('No puedes enviar mensajes a este alumno');
      }
      conv = await tx.conversation.upsert({
        where: { coachId_clientId: { coachId: coachRow.id, clientId: client.id } },
        create: { clientId: client.id, coachId: coachRow.id },
        update: {},
      });
    } else {
      conv = await tx.conversation.findFirst({
        where: { id: convConversationId, coachId: coachRow.id },
      });
      if (!conv) throw new NotFoundError('Conversación');
    }

    const m = await tx.chatMessage.create({
      data: {
        conversationId: conv.id,
        senderId: userId,
        senderRole: 'coach',
        content: text,
      },
    });
    await tx.conversation.update({
      where: { id: conv.id },
      data: {
        lastMessageAt: m.createdAt,
        lastMessagePreview: preview(text),
        clientUnreadCount: { increment: 1 },
      },
    });
    return m;
  });

  return mapMessage(msg);
}

function formatWorkoutDateLabel(d) {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function buildWorkoutCompletionMessage({ routineName, dateLabel, rpe, sensations, feedback }) {
  const lines = ['✅ Rutina completada', '', `Rutina: ${routineName || '—'}`, `Fecha planificada: ${dateLabel}`];
  if (rpe != null && rpe !== '') lines.push('', `RPE (percepción de esfuerzo): ${rpe}/10`);
  const sens = typeof sensations === 'string' ? sensations.trim() : '';
  if (sens) lines.push('', `Sensaciones: ${sens}`);
  const fb = typeof feedback === 'string' ? feedback.trim() : '';
  if (fb) lines.push('', `Mensaje / feedback: ${fb}`);
  let t = lines.join('\n');
  if (t.length > 8000) t = `${t.slice(0, 7997)}...`;
  return t;
}

/**
 * Envía un mensaje al chat coach–cliente con RPE, sensaciones y feedback cuando el alumno marca el entreno como hecho.
 * Incrementa el no leído del coach para que aparezca en el buzón de mensajes.
 */
export async function notifyCoachWorkoutCompleted({
  clientUserId,
  clientId,
  coachId,
  routineName,
  workoutDate,
  rpe,
  sensations,
  feedback,
}) {
  if (!clientUserId || !clientId || !coachId) return;
  const dateLabel = formatWorkoutDateLabel(workoutDate);
  const body = buildWorkoutCompletionMessage({
    routineName,
    dateLabel,
    rpe,
    sensations,
    feedback,
  });

  await prisma.$transaction(async (tx) => {
    const conv = await tx.conversation.upsert({
      where: { coachId_clientId: { coachId, clientId } },
      create: { clientId, coachId },
      update: {},
    });
    const m = await tx.chatMessage.create({
      data: {
        conversationId: conv.id,
        senderId: clientUserId,
        senderRole: 'cliente',
        content: body,
      },
    });
    await tx.conversation.update({
      where: { id: conv.id },
      data: {
        lastMessageAt: m.createdAt,
        lastMessagePreview: preview(body),
        coachUnreadCount: { increment: 1 },
      },
    });
  });
}
