import { prisma } from '../utils/prisma.js';
import { ForbiddenError, NotFoundError, BadRequestError } from '../utils/errors.js';
import * as repo from '../repositories/userDeletionRepository.js';
import { removeUserAssociatedFiles } from './userDeletionStorage.js';
import * as coachService from './coachService.js';

function logHardDeletion(payload) {
  if (process.env.NODE_ENV === 'test') return;
  console.info(
    JSON.stringify({
      event: 'user_hard_deleted',
      at: new Date().toISOString(),
      ...payload,
    })
  );
}

function assertAdminCanManageCoachUser(adminUserId, coachUserRow) {
  const cb = coachUserRow.createdById;
  if (cb !== adminUserId && cb !== null) {
    throw new ForbiddenError('No puedes eliminar este coach');
  }
}

function assertActorCanDeleteCoach(actor, targetCoachUser) {
  if (actor.role === 'admin') {
    assertAdminCanManageCoachUser(actor.id, targetCoachUser);
    return;
  }
  throw new ForbiddenError('Solo un administrador puede eliminar un coach');
}

const MSG_DELETE_ALUMNO_FORBIDDEN = 'No tienes permiso para eliminar este alumno';

function assertActorCanDeleteCliente(actor, targetUser) {
  if (actor.role === 'admin') return;
  if (actor.role === 'coach') {
    const coachProfileId = actor.coach?.id;
    if (!coachProfileId || !targetUser.client || targetUser.client.coachId !== coachProfileId) {
      throw new ForbiddenError(MSG_DELETE_ALUMNO_FORBIDDEN);
    }
    return;
  }
  throw new ForbiddenError('No tienes permiso para esta acción');
}

/**
 * Eliminación dura en transacción: coach → alumnos (User) → coach (User);
 * alumno → User (cascada Client y datos).
 *
 * @param {object} actor usuario autenticado (req.user)
 * @param {string} targetUserId id de User a eliminar
 */
export async function deleteUser(actor, targetUserId) {
  if (!actor?.id || !actor?.role) {
    throw new ForbiddenError('Usuario no válido');
  }
  if (actor.id === targetUserId) {
    throw new ForbiddenError('No puedes eliminar tu propia cuenta');
  }

  let logPayload;

  await prisma.$transaction(async (tx) => {
    const user = await repo.findUserWithRelations(tx, targetUserId);
    if (!user) throw new NotFoundError('Usuario');

    if (user.role === 'admin') {
      throw new ForbiddenError('No se puede eliminar un administrador');
    }

    if (user.role === 'coach') {
      if (!user.coach) throw new BadRequestError('Coach sin perfil asociado');
      assertActorCanDeleteCoach(actor, user);

      await removeUserAssociatedFiles({
        tx,
        userSnapshot: { id: user.id, role: user.role, coachId: user.coach.id },
      });

      const studentUserIds = user.coach.clients.map((c) => c.userId);
      for (const sid of studentUserIds) {
        const student = await repo.findUserWithRelations(tx, sid);
        if (student) {
          await removeUserAssociatedFiles({
            tx,
            userSnapshot: { id: student.id, role: student.role },
          });
          await repo.deleteUserById(tx, sid);
        }
      }

      logPayload = {
        actorId: actor.id,
        actorEmail: actor.email ?? null,
        actorRole: actor.role,
        deletedUserId: user.id,
        deletedEmail: user.email,
        deletedRole: user.role,
        coachProfileId: user.coach.id,
        deletedStudentUserIds: studentUserIds,
      };

      await repo.deleteUserById(tx, user.id);
      return;
    }

    if (user.role === 'cliente') {
      if (!user.client) throw new BadRequestError('Cliente sin perfil asociado');
      assertActorCanDeleteCliente(actor, user);

      await removeUserAssociatedFiles({
        tx,
        userSnapshot: { id: user.id, role: user.role },
      });

      logPayload = {
        actorId: actor.id,
        actorEmail: actor.email ?? null,
        actorRole: actor.role,
        deletedUserId: user.id,
        deletedEmail: user.email,
        deletedRole: user.role,
        clientProfileId: user.client.id,
      };

      await repo.deleteUserById(tx, user.id);
      return;
    }

    throw new BadRequestError('Rol no soportado para eliminación');
  });

  if (logPayload) {
    logHardDeletion(logPayload);
  }

  return { success: true };
}

/**
 * Elimina coach por id de perfil Coach (rutas admin). Transacción vía deleteUser.
 */
export async function deleteCoachByProfileId(actor, coachProfileId) {
  if (!actor?.id || actor.role !== 'admin') {
    throw new ForbiddenError('Solo un administrador puede eliminar un coach');
  }

  const coach = await prisma.coach.findFirst({
    where: {
      id: coachProfileId,
      user: { OR: [{ createdById: actor.id }, { createdById: null }] },
    },
    include: { user: true },
  });
  if (!coach) throw new NotFoundError('Coach');

  return deleteUser(actor, coach.userId);
}

/**
 * Elimina alumno por id de perfil Client (coach o admin).
 */
export async function deleteClientByProfileId(actor, clientProfileId) {
  const client = await prisma.client.findUnique({
    where: { id: clientProfileId },
    include: { user: true },
  });
  if (!client) throw new NotFoundError('Cliente');

  if (actor.role === 'admin') {
    return deleteUser(actor, client.userId);
  }

  if (actor.role === 'coach') {
    const coachProfileId = actor.coach?.id;
    if (!coachProfileId || client.coachId !== coachProfileId) {
      throw new ForbiddenError(MSG_DELETE_ALUMNO_FORBIDDEN);
    }
    return deleteUser(actor, client.userId);
  }

  throw new ForbiddenError('No tienes permiso para esta acción');
}

/**
 * Soft delete de coach (solo admin, mismo alcance que antes). No usa deleteUser.
 */
export async function softDeleteCoachByProfileId(actor, coachProfileId) {
  return coachService.softDeleteCoach(coachProfileId, actor.id);
}
