import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';
import * as userDeletionService from './userDeletionService.js';

const SALT_ROUNDS = 10;

function parseExpandList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * @param {string} coachId
 * @param {{ expand?: string[] }} [options] — expand: assignments (clientRoutines + rutina resumida), plannedWorkouts (calendario sin N+1 HTTP)
 */
export async function listClientsByCoach(coachId, options = {}) {
  const expandSet = new Set(parseExpandList(options.expand));

  const include = {
    user: { select: { id: true, email: true, name: true, lastName: true, status: true, lastPasswordPlain: true } },
    coach: { include: { user: { select: { id: true } } } },
  };

  if (expandSet.has('assignments')) {
    include.clientRoutines = {
      orderBy: { assignedAt: 'desc' },
      include: {
        routine: {
          select: { id: true, name: true, objective: true, level: true },
        },
      },
    };
  }
  if (expandSet.has('plannedWorkouts')) {
    include.plannedWorkouts = {
      orderBy: { date: 'desc' },
      include: {
        routine: { select: { id: true, name: true } },
      },
    };
  }

  const clients = await prisma.client.findMany({
    where: { coachId },
    include,
    orderBy: { createdAt: 'desc' },
  });
  return clients.map((c) => {
    const base = formatClient(c);
    if (expandSet.has('assignments')) {
      base.clientRoutines = (c.clientRoutines || []).map((a) => ({
        id: a.id,
        clientId: a.clientId,
        routineId: a.routineId,
        assignedAt: a.assignedAt,
        active: a.active,
        routine: a.routine,
      }));
    }
    if (expandSet.has('plannedWorkouts')) {
      base.plannedWorkouts = (c.plannedWorkouts || []).map((w) => ({
        id: w.id,
        clientId: w.clientId,
        routineId: w.routineId,
        date: w.date,
        notes: w.notes,
        completed: w.completed,
        completedAt: w.completedAt,
        rpe: w.rpe,
        sensations: w.sensations,
        feedback: w.feedback,
        clientNotes: w.clientNotes,
        routine: w.routine,
      }));
    }
    return base;
  });
}

export async function getClientById(id, coachId = null) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      user: true,
      coach: { include: { user: { select: { name: true, lastName: true, email: true } } } },
    },
  });
  if (!client) throw new NotFoundError('Cliente');
  if (coachId && client.coachId !== coachId) {
    throw new ForbiddenError('No tienes acceso a este cliente');
  }
  return formatClient(client);
}

export async function createClient(coachId, data) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existing) throw new BadRequestError('Ya existe un usuario con ese email');

  const plain = (data.password && String(data.password).trim()) || 'cliente123';
  const passwordHash = await bcrypt.hash(plain, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      lastPasswordPlain: plain,
      name: data.name,
      lastName: data.lastName || null,
      role: 'cliente',
      status: 'active',
      assignedCoachId: coachId,
    },
  });
  const client = await prisma.client.create({
    data: {
      userId: user.id,
      coachId,
      age: data.age ? parseInt(data.age, 10) : null,
      weight: data.weight ? parseFloat(data.weight) : null,
      height: data.height ? parseFloat(data.height) : null,
      objective: data.objective || null,
      objectiveDescription:
        data.objective === 'personalizado' ? (data.objectiveDescription?.trim() || null) : null,
      level: data.level || null,
    },
    include: { user: true },
  });
  const { passwordHash: _, ...safeUser } = user;
  return { ...formatClient(client), user: { ...safeUser } };
}

export async function updateClient(id, coachId, data) {
  if (coachId && coachId !== 'self') await getClientById(id, coachId);
  const client = await prisma.client.findUnique({ where: { id }, include: { user: true } });
  if (!client) throw new NotFoundError('Cliente');
  const nextObjective = data.objective !== undefined ? data.objective : client.objective;
  let objectiveDescriptionPatch;
  if (nextObjective !== 'personalizado') {
    objectiveDescriptionPatch = null;
  } else if (data.objectiveDescription !== undefined) {
    objectiveDescriptionPatch = data.objectiveDescription?.trim() || null;
  } else {
    objectiveDescriptionPatch = undefined;
  }

  /** Prisma no acepta `undefined` en data: hay que omitir la clave. */
  const clientData = {};
  if (data.age !== undefined) clientData.age = data.age ? parseInt(data.age, 10) : null;
  if (data.weight !== undefined) clientData.weight = data.weight ? parseFloat(data.weight) : null;
  if (data.height !== undefined) clientData.height = data.height ? parseFloat(data.height) : null;
  if (data.objective !== undefined) clientData.objective = data.objective;
  if (data.level !== undefined) clientData.level = data.level;
  if (objectiveDescriptionPatch !== undefined) {
    clientData.objectiveDescription = objectiveDescriptionPatch;
  }

  if (Object.keys(clientData).length > 0) {
    await prisma.client.update({
      where: { id },
      data: clientData,
    });
  }

  const userData = {};
  if (data.name !== undefined) userData.name = data.name;
  if (data.lastName !== undefined) userData.lastName = data.lastName;
  if (data.email !== undefined) {
    const nextEmail = String(data.email).toLowerCase().trim();
    if (nextEmail !== client.user.email) {
      const taken = await prisma.user.findFirst({
        where: { email: nextEmail, id: { not: client.userId } },
      });
      if (taken) throw new BadRequestError('Ya existe un usuario con ese email');
    }
    userData.email = nextEmail;
  }
  if (Object.keys(userData).length > 0) {
    await prisma.user.update({
      where: { id: client.userId },
      data: userData,
    });
  }
  return formatClient(await prisma.client.findUnique({ where: { id }, include: { user: true, coach: { include: { user: { select: { id: true } } } } } }));
}

export async function deleteClient(clientProfileId, actor) {
  return userDeletionService.deleteClientByProfileId(actor, clientProfileId);
}

function formatClient(c) {
  const coachUserId = c.coach?.userId || c.coach?.user?.id;
  return {
    id: c.id,
    userId: c.userId,
    coachId: c.coachId,
    coachUserId, // user.id del coach, para compatibilidad con frontend
    age: c.age,
    weight: c.weight,
    height: c.height,
    objective: c.objective,
    objectiveDescription: c.objectiveDescription,
    level: c.level,
    createdAt: c.createdAt,
    user: c.user ? {
      id: c.user.id,
      email: c.user.email,
      name: c.user.name,
      lastName: c.user.lastName,
      status: c.user.status,
      lastPasswordPlain: c.user.lastPasswordPlain ?? null,
    } : undefined,
    coach: c.coach,
  };
}
