import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';
import {
  activateCoachUserAndAllClients,
  blockCoachUserAndAllClients,
} from './coachClientBlockCascade.js';

const SALT_ROUNDS = 10;

/** activeClientsByCoachId: mapa coachId -> nº clientes con user activo (opcional). */
function formatCoach(c, activeClientsByCoachId = {}) {
  const u = c.user || {};
  const activeClientsCount =
    typeof activeClientsByCoachId[c.id] === 'number'
      ? activeClientsByCoachId[c.id]
      : 0;
  return {
    id: c.id,
    userId: c.userId,
    name: u.name,
    lastName: u.lastName,
    email: u.email,
    phone: c.phone,
    specialty: c.specialty,
    bio: c.bio,
    subscriptionPlan: c.subscriptionPlan || 'basico',
    subscriptionStatus: c.subscriptionStatus || 'activa',
    active: u.status === 'active',
    status: u.status,
    deletedAt: c.deletedAt ?? null,
    coachEliminado: !!c.deletedAt,
    legacyUnassigned: u.createdById == null,
    clientsCount: c._count?.clients ?? 0,
    activeClientsCount,
    routinesCount: c._count?.routines ?? 0,
    user: u.id
      ? {
          id: u.id,
          email: u.email,
          name: u.name,
          lastName: u.lastName,
          status: u.status,
          lastPasswordPlain: u.lastPasswordPlain ?? null,
        }
      : undefined,
  };
}

/** Mutaciones: solo coach no eliminado (soft delete) y bajo el alcance del admin. */
const coachAdminScopeWhere = (createdByAdminUserId) => ({
  deletedAt: null,
  user: {
    OR: [{ createdById: createdByAdminUserId }, { createdById: null }],
  },
});

export async function listCoaches(createdByAdminUserId) {
  const coaches = await prisma.coach.findMany({
    where: createdByAdminUserId
      ? {
          user: {
            OR: [{ createdById: createdByAdminUserId }, { createdById: null }],
          },
        }
      : {},
    include: {
      user: { select: { id: true, email: true, name: true, lastName: true, status: true, createdById: true, lastPasswordPlain: true } },
      _count: {
        select: {
          clients: true,
          routines: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  const ids = coaches.map((c) => c.id);
  let activeMap = Object.fromEntries(ids.map((id) => [id, 0]));
  if (ids.length) {
    const grouped = await prisma.client.groupBy({
      by: ['coachId'],
      where: {
        coachId: { in: ids },
        user: { status: 'active' },
      },
      _count: { _all: true },
    });
    for (const r of grouped) {
      activeMap[r.coachId] = r._count._all;
    }
  }
  return coaches.map((c) => formatCoach(c, activeMap));
}

/** Lectura admin: incluye soft-deleted para listados y detalle. */
export async function getCoachById(id, createdByAdminUserId = null) {
  const coach = await prisma.coach.findFirst({
    where: {
      id,
      ...(createdByAdminUserId
        ? {
            user: {
              OR: [{ createdById: createdByAdminUserId }, { createdById: null }],
            },
          }
        : {}),
    },
    include: {
      user: true,
      _count: {
        select: {
          clients: true,
          routines: true,
        },
      },
    },
  });
  if (!coach) throw new NotFoundError('Coach');
  const activeN = await prisma.client.count({
    where: { coachId: id, user: { status: 'active' } },
  });
  return formatCoach(coach, { [id]: activeN });
}

export async function createCoach(data, createdByAdminUserId) {
  if (!createdByAdminUserId) {
    throw new ForbiddenError('Solo un administrador puede crear coaches');
  }
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existing) throw new BadRequestError('Ya existe un usuario con ese email');

  const plain = (data.password && String(data.password).trim()) || 'coach123';
  const passwordHash = await bcrypt.hash(plain, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      lastPasswordPlain: plain,
      name: data.name,
      lastName: data.lastName || null,
      role: 'coach',
      status: 'active',
      createdById: createdByAdminUserId,
    },
  });
  const coach = await prisma.coach.create({
    data: {
      userId: user.id,
      phone: data.phone || null,
      specialty: data.specialty || null,
      bio: data.bio || null,
      subscriptionPlan: data.subscriptionPlan || 'basico',
      subscriptionStatus: data.subscriptionStatus || 'activa',
    },
    include: { user: true },
  });
  const { passwordHash: _, ...safeUser } = user;
  const coachDto = await getCoachById(coach.id, createdByAdminUserId);
  return { coach: coachDto, user: { ...safeUser } };
}

export async function updateCoach(id, data, createdByAdminUserId = null) {
  const coach = await prisma.coach.findFirst({
    where: {
      id,
      ...(createdByAdminUserId ? coachAdminScopeWhere(createdByAdminUserId) : { deletedAt: null }),
    },
    include: { user: true },
  });
  if (!coach) throw new NotFoundError('Coach');

  await prisma.coach.update({
    where: { id },
    data: {
      phone: data.phone !== undefined ? data.phone : undefined,
      specialty: data.specialty !== undefined ? data.specialty : undefined,
      bio: data.bio !== undefined ? data.bio : undefined,
      subscriptionPlan: data.subscriptionPlan !== undefined ? data.subscriptionPlan : undefined,
      subscriptionStatus: data.subscriptionStatus !== undefined ? data.subscriptionStatus : undefined,
    },
  });
  if (data.name !== undefined || data.email !== undefined) {
    await prisma.user.update({
      where: { id: coach.userId },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        email: data.email !== undefined ? data.email.toLowerCase() : undefined,
      },
    });
  }
  return getCoachById(id, createdByAdminUserId);
}

/**
 * Desactiva al coach y en cascada a todos los usuarios cliente ligados a su plantilla Coach.
 */
export async function deactivateCoach(coachId, createdByAdminUserId) {
  await prisma.$transaction(async (tx) => {
    const coach = await tx.coach.findFirst({
      where: { id: coachId, ...coachAdminScopeWhere(createdByAdminUserId) },
      select: { id: true },
    });
    if (!coach) throw new NotFoundError('Coach');

    await blockCoachUserAndAllClients(tx, coachId);
  });
  return getCoachById(coachId, createdByAdminUserId);
}

/**
 * Reactiva al coach y a todos sus clientes (inverso de deactivateCoach).
 * Pensado para futuras reglas (p. ej. transferencia) vía otros servicios.
 */
export async function activateCoach(coachId, createdByAdminUserId) {
  await prisma.$transaction(async (tx) => {
    const coach = await tx.coach.findFirst({
      where: { id: coachId, ...coachAdminScopeWhere(createdByAdminUserId) },
      select: { id: true },
    });
    if (!coach) throw new NotFoundError('Coach');

    await activateCoachUserAndAllClients(tx, coachId);
  });
  return getCoachById(coachId, createdByAdminUserId);
}

/**
 * Soft delete: marca Coach.deletedAt, inactiva coach y todos sus clientes (sin huérfanos).
 */
export async function softDeleteCoach(coachId, createdByAdminUserId) {
  await prisma.$transaction(async (tx) => {
    const coach = await tx.coach.findFirst({
      where: { id: coachId, ...coachAdminScopeWhere(createdByAdminUserId) },
      select: { id: true },
    });
    if (!coach) throw new NotFoundError('Coach');

    await blockCoachUserAndAllClients(tx, coachId);
    await tx.coach.update({
      where: { id: coachId },
      data: { deletedAt: new Date() },
    });
  });
  return { success: true };
}
