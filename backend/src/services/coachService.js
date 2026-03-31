import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';
import { assertPasswordPolicy } from '../utils/passwordPolicy.js';
import {
  normalizeUsername,
  assertValidUsernameShape,
  normalizeCoachEmail,
} from '../utils/authIdentity.js';
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
    username: u.username,
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
          username: u.username,
          email: u.email,
          name: u.name,
          lastName: u.lastName,
          status: u.status,
        }
      : undefined,
  };
}

/**
 * Mutaciones: coach activo (sin soft-delete).
 * `adminUserId` null → admin de plataforma: cualquier coach.
 * string → compatibilidad: solo coaches creados por ese admin o legacy (createdById null).
 */
const coachAdminScopeWhere = (createdByAdminUserId) => ({
  deletedAt: null,
  user: {
    OR: [{ createdById: createdByAdminUserId }, { createdById: null }],
  },
});

function coachMutationWhere(coachId, adminUserId) {
  if (adminUserId == null) {
    return { id: coachId, deletedAt: null };
  }
  return { id: coachId, ...coachAdminScopeWhere(adminUserId) };
}

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
      user: { select: { id: true, username: true, email: true, name: true, lastName: true, status: true, createdById: true } },
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
      ...(createdByAdminUserId != null
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

/**
 * Detalle para panel admin: coach + clientes (perfil y usuario).
 */
export async function getCoachByIdWithClients(id, createdByAdminUserId = null) {
  const coach = await prisma.coach.findFirst({
    where: {
      id,
      ...(createdByAdminUserId != null
        ? {
            user: {
              OR: [{ createdById: createdByAdminUserId }, { createdById: null }],
            },
          }
        : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          lastName: true,
          status: true,
          createdAt: true,
          createdById: true,
        },
      },
      clients: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              name: true,
              lastName: true,
              status: true,
            },
          },
        },
      },
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
  const base = formatCoach(coach, { [id]: activeN });
  base.clients = (coach.clients || []).map((cl) => ({
    id: cl.id,
    userId: cl.userId,
    age: cl.age,
    weight: cl.weight,
    height: cl.height,
    objective: cl.objective,
    objectiveDescription: cl.objectiveDescription,
    level: cl.level,
    createdAt: cl.createdAt,
    user: cl.user
      ? {
          id: cl.user.id,
          username: cl.user.username,
          email: cl.user.email,
          name: cl.user.name,
          lastName: cl.user.lastName,
          status: cl.user.status,
        }
      : null,
  }));
  return base;
}

export async function createCoach(data, createdByAdminUserId) {
  if (!createdByAdminUserId) {
    throw new ForbiddenError('Solo un administrador puede crear coaches');
  }
  const username = normalizeUsername(data.username);
  assertValidUsernameShape(username);
  const email = normalizeCoachEmail(data.email);

  const dupUser = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (dupUser) {
    if (dupUser.username === username) {
      throw new BadRequestError('Ese nombre de usuario ya está en uso.');
    }
    throw new BadRequestError('Ese correo electrónico ya está registrado.');
  }

  const plain = data.password != null ? String(data.password).trim() : '';
  if (!plain) {
    throw new BadRequestError('La contraseña es obligatoria');
  }
  assertPasswordPolicy(plain);
  const passwordHash = await bcrypt.hash(plain, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
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
    where: coachMutationWhere(id, createdByAdminUserId),
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
  if (data.name !== undefined || data.email !== undefined || data.username !== undefined) {
    const userUpdate = {};
    if (data.name !== undefined) userUpdate.name = data.name;
    if (data.email !== undefined) {
      const nextEmail = normalizeCoachEmail(data.email);
      if (nextEmail !== coach.user.email) {
        const taken = await prisma.user.findFirst({
          where: { email: nextEmail, id: { not: coach.userId } },
        });
        if (taken) throw new BadRequestError('Ese correo electrónico ya está registrado.');
      }
      userUpdate.email = nextEmail;
    }
    if (data.username !== undefined) {
      const nextUser = normalizeUsername(data.username);
      assertValidUsernameShape(nextUser);
      if (nextUser !== coach.user.username) {
        const taken = await prisma.user.findFirst({
          where: { username: nextUser, id: { not: coach.userId } },
        });
        if (taken) throw new BadRequestError('Ese nombre de usuario ya está en uso.');
      }
      userUpdate.username = nextUser;
    }
    await prisma.user.update({
      where: { id: coach.userId },
      data: userUpdate,
    });
  }

  if (data.password !== undefined && data.password !== null) {
    const plain = String(data.password).trim();
    if (plain) {
      assertPasswordPolicy(plain);
      const passwordHash = await bcrypt.hash(plain, SALT_ROUNDS);
      await prisma.user.update({
        where: { id: coach.userId },
        data: {
          passwordHash,
          tokenVersion: { increment: 1 },
        },
      });
    }
  }

  return getCoachById(id, createdByAdminUserId);
}

/**
 * Desactiva al coach y en cascada a todos los usuarios cliente ligados a su plantilla Coach.
 */
export async function deactivateCoach(coachId, createdByAdminUserId) {
  await prisma.$transaction(async (tx) => {
    const coach = await tx.coach.findFirst({
      where: coachMutationWhere(coachId, createdByAdminUserId),
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
      where: coachMutationWhere(coachId, createdByAdminUserId),
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
      where: coachMutationWhere(coachId, createdByAdminUserId),
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
