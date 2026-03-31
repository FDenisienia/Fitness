import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import { assertPasswordPolicy } from '../utils/passwordPolicy.js';
import {
  normalizeUsername,
  assertValidUsernameShape,
} from '../utils/authIdentity.js';
import * as coachService from './coachService.js';

const SALT_ROUNDS = 10;

function logAdminAction(event, payload) {
  if (process.env.NODE_ENV === 'test') return;
  console.info(
    JSON.stringify({
      event,
      at: new Date().toISOString(),
      ...payload,
    })
  );
}

/**
 * Perfil del admin autenticado: username y/o contraseña (rehash + tokenVersion).
 */
export async function updateAdminOwnProfile(adminUserId, body) {
  const usernameRaw = body?.username;
  const passwordRaw = body?.password;

  const hasUsername =
    usernameRaw !== undefined && usernameRaw !== null && String(usernameRaw).trim() !== '';
  const hasPassword =
    passwordRaw !== undefined && passwordRaw !== null && String(passwordRaw).trim() !== '';

  if (!hasUsername && !hasPassword) {
    throw new BadRequestError('Indicá al menos un campo: username o password');
  }

  const user = await prisma.user.findUnique({
    where: { id: adminUserId },
    select: { id: true, username: true, role: true },
  });
  if (!user || user.role !== 'admin') {
    throw new NotFoundError('Usuario');
  }

  const data = {};

  if (hasUsername) {
    const next = normalizeUsername(usernameRaw);
    assertValidUsernameShape(next);
    if (next !== user.username) {
      const taken = await prisma.user.findFirst({
        where: { username: next, id: { not: adminUserId } },
      });
      if (taken) {
        throw new BadRequestError('Ese nombre de usuario ya está en uso.');
      }
    }
    data.username = next;
  }

  if (hasPassword) {
    const plain = String(passwordRaw).trim();
    assertPasswordPolicy(plain);
    data.passwordHash = await bcrypt.hash(plain, SALT_ROUNDS);
    data.tokenVersion = { increment: 1 };
  }

  const updated = await prisma.user.update({
    where: { id: adminUserId },
    data,
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
      tokenVersion: true,
    },
  });

  logAdminAction('admin_profile_updated', { adminUserId, changedUsername: hasUsername, changedPassword: hasPassword });

  return {
    id: updated.id,
    username: updated.username,
    email: updated.email,
    name: updated.name,
    lastName: updated.lastName,
    role: updated.role,
    status: updated.status,
    active: updated.status === 'active',
    createdAt: updated.createdAt,
  };
}

export async function listCoachesForAdmin() {
  return coachService.listCoaches(null);
}

export async function getCoachDetailForAdmin(coachProfileId) {
  return coachService.getCoachByIdWithClients(coachProfileId, null);
}

export async function updateCoachByAdmin(coachProfileId, body) {
  const coach = await coachService.updateCoach(coachProfileId, body, null);
  logAdminAction('admin_coach_updated', { coachProfileId });
  return coach;
}
