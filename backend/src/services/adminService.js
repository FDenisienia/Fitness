import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';
import { config } from '../config/index.js';
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
 * Perfil del admin autenticado: nombre, apellido, email, username y/o contraseña.
 * Si cambia la contraseña se incrementa tokenVersion y se devuelve un JWT nuevo.
 */
export async function updateAdminOwnProfile(adminUserId, body) {
  const usernameRaw = body?.username;
  const passwordRaw = body?.password;

  const hasUsername =
    usernameRaw !== undefined && usernameRaw !== null && String(usernameRaw).trim() !== '';
  const hasPassword =
    passwordRaw !== undefined && passwordRaw !== null && String(passwordRaw).trim() !== '';

  const user = await prisma.user.findUnique({
    where: { id: adminUserId },
    select: {
      id: true,
      username: true,
      role: true,
      email: true,
      name: true,
      lastName: true,
    },
  });
  if (!user || user.role !== 'admin') {
    throw new NotFoundError('Usuario');
  }

  const data = {};

  if (body?.name !== undefined) {
    const n = String(body.name).trim();
    if (!n) {
      throw new BadRequestError('El nombre no puede estar vacío.');
    }
    if (n !== user.name) {
      data.name = n;
    }
  }

  if (body?.lastName !== undefined) {
    const nextLn =
      body.lastName == null || String(body.lastName).trim() === ''
        ? null
        : String(body.lastName).trim();
    const curLn = user.lastName ?? null;
    if (nextLn !== curLn) {
      data.lastName = nextLn;
    }
  }

  if (body?.email !== undefined) {
    const e = String(body.email).trim().toLowerCase();
    if (!e) {
      throw new BadRequestError('El correo no puede estar vacío.');
    }
    const cur = (user.email || '').trim().toLowerCase();
    if (e !== cur) {
      const taken = await prisma.user.findFirst({
        where: { email: e, id: { not: adminUserId } },
      });
      if (taken) {
        throw new BadRequestError('Ese correo electrónico ya está registrado.');
      }
      data.email = e;
    }
  }

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
      data.username = next;
    }
  }

  if (hasPassword) {
    const plain = String(passwordRaw).trim();
    assertPasswordPolicy(plain);
    data.passwordHash = await bcrypt.hash(plain, SALT_ROUNDS);
    data.tokenVersion = { increment: 1 };
  }

  if (Object.keys(data).length === 0) {
    throw new BadRequestError('No indicáste ningún cambio.');
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

  let token = null;
  if (hasPassword) {
    token = jwt.sign(
      {
        userId: updated.id,
        role: updated.role,
        tv: updated.tokenVersion ?? 0,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
  }

  logAdminAction('admin_profile_updated', {
    adminUserId,
    changedFields: Object.keys(data),
    changedPassword: hasPassword,
  });

  const profile = {
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

  return { user: profile, token };
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
