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
  let conv = await prisma.conversation.findFirst({
    where: { clientId, coachId },
  });
  if (!conv) {
    conv = await prisma.conversation.create({
      data: { clientId, coachId },
    });
  }
  return conv;
}

/** Cliente: conversación con su coach (crea fila si no existe). */
export async function getMyConversationClient(userId) {
  const client = await getClientByUserId(userId);
  const conv = await getOrCreateConversation(client.id, client.coachId);
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

/** Coach: lista de alumnos con estado de chat (sin crear conversaciones vacías). */
export async function listInboxForCoach(userId) {
  const coach = await getCoachByUserId(userId);
  const clients = await prisma.client.findMany({
    where: { coachId: coach.id },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
  const convs = await prisma.conversation.findMany({
    where: { coachId: coach.id },
  });
  const byClient = new Map(convs.map((c) => [c.clientId, c]));
  return clients.map((cl) => {
    const conv = byClient.get(cl.id);
    return {
      clientId: cl.id,
      clientUserId: cl.user.id,
      otherParticipant: {
        id: cl.user.id,
        name: cl.user.name,
        lastName: cl.user.lastName,
      },
      conversationId: conv?.id ?? null,
      lastMessageAt: conv?.lastMessageAt?.toISOString() ?? null,
      lastMessagePreview: conv?.lastMessagePreview ?? null,
      clientUnreadCount: conv?.clientUnreadCount ?? 0,
      coachUnreadCount: conv?.coachUnreadCount ?? 0,
    };
  });
}

async function resolveConversationForCoach(userId, conversationId, clientId) {
  const coach = await getCoachByUserId(userId);
  if (clientId) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, coachId: coach.id },
    });
    if (!client) throw new NotFoundError('Cliente');
    const conv = await getOrCreateConversation(client.id, coach.id);
    return { conv, coach };
  }
  if (conversationId) {
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, coachId: coach.id },
    });
    if (!conv) throw new NotFoundError('Conversación');
    return { conv, coach };
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

export async function listMessages({ userId, role, conversationId, clientId }) {
  let conv;
  if (role === 'cliente') {
    const client = await getClientByUserId(userId);
    if (conversationId) {
      conv = await prisma.conversation.findFirst({
        where: { id: conversationId, clientId: client.id },
      });
    } else {
      conv = await getOrCreateConversation(client.id, client.coachId);
    }
    if (!conv) throw new NotFoundError('Conversación');
  } else {
    ({ conv } = await resolveConversationForCoach(userId, conversationId, clientId));
  }

  await markConversationRead(conv, role);

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: 'asc' },
    take: 500,
  });
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
  let conv;
  if (role === 'cliente') {
    const client = await getClientByUserId(userId);
    conv = await getOrCreateConversation(client.id, client.coachId);
  } else {
    ({ conv } = await resolveConversationForCoach(userId, conversationId, clientId));
  }

  const senderRole = role === 'cliente' ? 'cliente' : 'coach';
  const msg = await prisma.$transaction(async (tx) => {
    const m = await tx.chatMessage.create({
      data: {
        conversationId: conv.id,
        senderId: userId,
        senderRole,
        content: text,
      },
    });
    const incCoach = senderRole === 'cliente';
    await tx.conversation.update({
      where: { id: conv.id },
      data: {
        lastMessageAt: m.createdAt,
        lastMessagePreview: preview(text),
        coachUnreadCount: incCoach ? { increment: 1 } : undefined,
        clientUnreadCount: !incCoach ? { increment: 1 } : undefined,
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
  let text = lines.join('\n');
  if (text.length > 8000) text = `${text.slice(0, 7997)}...`;
  return text;
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
  const conv = await getOrCreateConversation(clientId, coachId);
  const dateLabel = formatWorkoutDateLabel(workoutDate);
  const text = buildWorkoutCompletionMessage({
    routineName,
    dateLabel,
    rpe,
    sensations,
    feedback,
  });

  await prisma.$transaction(async (tx) => {
    const m = await tx.chatMessage.create({
      data: {
        conversationId: conv.id,
        senderId: clientUserId,
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
  });
}
