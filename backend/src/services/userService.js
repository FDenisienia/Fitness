import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { ForbiddenError, NotFoundError } from '../utils/errors.js';
import { assertPasswordPolicy } from '../utils/passwordPolicy.js';

const SALT_ROUNDS = 10;

/**
 * Coaches visibles para admin: creados por él O legacy (createdById null).
 * Incluye coaches inactivos y soft-deleted (deletedAt); el front muestra estado.
 * Clientes del coach: todos los ligados por client.coachId (activos e inactivos).
 */
function adminCoachUserWhere(adminUserId) {
  return {
    role: 'coach',
    OR: [{ createdById: adminUserId }, { createdById: null }],
  };
}

export async function getUsersForViewer(currentUser) {
  if (!currentUser?.id || !currentUser?.role) {
    throw new ForbiddenError('Usuario no válido');
  }

  if (currentUser.role === 'admin') {
    const users = await prisma.user.findMany({
      where: adminCoachUserWhere(currentUser.id),
      include: {
        coach: {
          include: {
            _count: {
              select: {
                clients: true,
                routines: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const withCoach = users.filter((u) => u.coach);
    const coachIds = withCoach.map((u) => u.coach.id);

    let activeByCoach = Object.fromEntries(coachIds.map((id) => [id, 0]));
    if (coachIds.length) {
      const grouped = await prisma.client.groupBy({
        by: ['coachId'],
        where: {
          coachId: { in: coachIds },
          user: { status: 'active' },
        },
        _count: { _all: true },
      });
      for (const r of grouped) {
        activeByCoach[r.coachId] = r._count._all;
      }
    }

    return withCoach.map((u) => formatCoachUserForAdmin(u, activeByCoach));
  }

  if (currentUser.role === 'coach') {
    const coachProfileId = currentUser.coach?.id;
    if (!coachProfileId) {
      return [];
    }
    const users = await prisma.user.findMany({
      where: {
        role: 'cliente',
        client: { coachId: coachProfileId },
      },
      include: {
        client: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return users.map(formatClientUserForCoach);
  }

  throw new ForbiddenError('No tienes acceso a este recurso');
}

/**
 * Admin: coaches (y cuentas no-cliente que definamos). Coach: solo clientes con client.coachId = su Coach.id.
 * Orden: existencia → permisos → política de contraseña → hash e invalidación de sesiones.
 */
export async function updateUserPassword(actor, targetUserId, { password }) {
  const rawPassword = typeof password === 'string' ? password.trim() : password;

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      client: { select: { coachId: true } },
    },
  });
  if (!target) throw new NotFoundError('Usuario');

  if (actor.role === 'admin') {
    if (target.role === 'cliente') {
      throw new ForbiddenError('Los administradores no pueden gestionar contraseñas de alumnos');
    }
  } else if (actor.role === 'coach') {
    const coachId = actor.coach?.id;
    if (!coachId) {
      throw new ForbiddenError('No tienes permiso para esta acción');
    }
    if (target.role !== 'cliente' || !target.client || target.client.coachId !== coachId) {
      throw new ForbiddenError('Solo puedes modificar la contraseña de tus clientes');
    }
  } else {
    throw new ForbiddenError('No tienes permiso para esta acción');
  }

  assertPasswordPolicy(rawPassword);

  const passwordHash = await bcrypt.hash(rawPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      passwordHash,
      lastPasswordPlain: rawPassword,
      tokenVersion: { increment: 1 },
    },
  });

  if (process.env.NODE_ENV !== 'test') {
    console.info(
      JSON.stringify({
        event: 'password_changed',
        actorId: actor.id,
        targetUserId,
        at: new Date().toISOString(),
      })
    );
  }

  return { success: true };
}

function formatCoachUserForAdmin(u, activeByCoach) {
  const c = u.coach;
  const cid = c?.id;
  const totalClients = c?._count?.clients ?? 0;
  const activeClients = cid != null ? activeByCoach[cid] ?? 0 : 0;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    lastName: u.lastName,
    role: u.role,
    status: u.status,
    active: u.status === 'active',
    createdAt: u.createdAt,
    createdById: u.createdById,
    legacyUnassigned: u.createdById == null,
    coachId: c?.id ?? null,
    specialty: c?.specialty ?? null,
    subscriptionPlan: c?.subscriptionPlan || 'basico',
    subscriptionStatus: c?.subscriptionStatus || 'activa',
    deletedAt: c?.deletedAt ?? null,
    coachEliminado: !!c?.deletedAt,
    clientsCount: totalClients,
    activeClientsCount: activeClients,
    routinesCount: c?._count?.routines ?? 0,
    lastPasswordPlain: u.lastPasswordPlain ?? null,
  };
}

function formatClientUserForCoach(u) {
  const cl = u.client;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    lastName: u.lastName,
    role: u.role,
    status: u.status,
    active: u.status === 'active',
    createdAt: u.createdAt,
    coachId: cl?.coachId ?? null,
    clientId: cl?.id ?? null,
    age: cl?.age ?? null,
    objective: cl?.objective ?? null,
    objectiveDescription: cl?.objectiveDescription ?? null,
    level: cl?.level ?? null,
    lastPasswordPlain: u.lastPasswordPlain ?? null,
  };
}
