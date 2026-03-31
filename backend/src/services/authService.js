import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';
import { config } from '../config/index.js';
import { UnauthorizedError, BadRequestError } from '../utils/errors.js';
import { isUserBlocked } from '../utils/userStatus.js';
import { assertPasswordPolicy } from '../utils/passwordPolicy.js';
import {
  normalizeUsername,
  assertValidUsernameShape,
  normalizeCoachEmail,
  normalizeOptionalClientEmail,
} from '../utils/authIdentity.js';
import * as userAuthModel from '../models/userAuth.model.js';

const SALT_ROUNDS = 10;

const CREDENTIALS_ERROR = 'Usuario o contraseña incorrectos';
const BLOCKED_ERROR = 'Usuario bloqueado';

/**
 * Registro público: coach (username, email, password) o cliente (username, password, coach_id).
 * Mantiene compatibilidad con el dominio existente (filas Coach / Client).
 */
export async function register(body) {
  const role = String(body?.role || '').toLowerCase();
  if (role !== 'coach' && role !== 'cliente') {
    throw new BadRequestError('Rol inválido. Usá «coach» o «cliente».');
  }

  const username = normalizeUsername(body?.username);
  assertValidUsernameShape(username);

  const plain = body?.password != null ? String(body.password).trim() : '';
  if (!plain) {
    throw new BadRequestError('La contraseña es obligatoria');
  }
  assertPasswordPolicy(plain);

  const usernameTaken = await userAuthModel.findUsernameTaken(username);
  if (usernameTaken) {
    throw new BadRequestError('Ese nombre de usuario ya está en uso.');
  }

  const passwordHash = await bcrypt.hash(plain, SALT_ROUNDS);

  if (role === 'coach') {
    const email = normalizeCoachEmail(body?.email);
    const emailTaken = await userAuthModel.findEmailTaken(email);
    if (emailTaken) {
      throw new BadRequestError('Ese correo electrónico ya está registrado.');
    }

    const user = await prisma.$transaction((tx) =>
      userAuthModel.createCoachUserInTransaction(
        tx,
        {
          username,
          email,
          passwordHash,
          name: username,
          lastName: null,
          role: 'coach',
          status: 'active',
          tokenVersion: 0,
          createdById: null,
          assignedCoachId: null,
        },
        {
          phone: null,
          specialty: null,
          bio: null,
          subscriptionPlan: 'basico',
          subscriptionStatus: 'activa',
        }
      )
    );

    const { passwordHash: _, ...safe } = user;
    return { user: formatUser(safe), token: generateToken(user) };
  }

  const coachIdRaw = body?.coach_id ?? body?.coachId;
  if (coachIdRaw == null || String(coachIdRaw).trim() === '') {
    throw new BadRequestError('Debés indicar un coach válido (coach_id).');
  }
  const coachProfileId = String(coachIdRaw).trim();
  const coachProfile = await userAuthModel.findCoachProfileForClientRegistration(coachProfileId);
  if (!coachProfile) {
    throw new BadRequestError('El coach indicado no existe o no está disponible.');
  }

  const emailOpt = normalizeOptionalClientEmail(body?.email);
  if (emailOpt) {
    const emailTaken = await userAuthModel.findEmailTaken(emailOpt);
    if (emailTaken) {
      throw new BadRequestError('Ese correo electrónico ya está registrado.');
    }
  }

  const user = await prisma.$transaction((tx) =>
    userAuthModel.createClientUserInTransaction(tx, {
      userData: {
        username,
        email: emailOpt,
        passwordHash,
        name: username,
        lastName: null,
        role: 'cliente',
        status: 'active',
        tokenVersion: 0,
        createdById: null,
        assignedCoachId: coachProfile.id,
      },
      clientProfileData: {
        coachId: coachProfile.id,
        age: null,
        weight: null,
        height: null,
        objective: null,
        objectiveDescription: null,
        level: null,
      },
    })
  );

  const { passwordHash: _, ...safe } = user;
  return { user: formatUser(safe), token: generateToken(user) };
}

export async function login(usernameInput, password) {
  const username = normalizeUsername(usernameInput);
  assertValidUsernameShape(username);
  const plain = password != null ? String(password).trim() : '';
  if (!plain) {
    throw new UnauthorizedError(CREDENTIALS_ERROR);
  }

  const user = await userAuthModel.findUserByUsernameForAuth(username);
  if (!user) {
    throw new UnauthorizedError(CREDENTIALS_ERROR);
  }
  if (isUserBlocked(user.status)) {
    throw new UnauthorizedError(BLOCKED_ERROR);
  }
  const valid = await bcrypt.compare(plain, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError(CREDENTIALS_ERROR);
  }
  if (user.role === 'coach' && user.coach?.deletedAt) {
    throw new UnauthorizedError(BLOCKED_ERROR);
  }
  if (user.role === 'cliente' && user.client?.coach) {
    const ch = user.client.coach;
    if (ch.deletedAt || isUserBlocked(ch.user?.status)) {
      throw new UnauthorizedError(BLOCKED_ERROR);
    }
  }
  const { passwordHash: _, ...safeUser } = user;
  return { user: formatUser(safeUser), token: generateToken(user) };
}

export async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      coach: true,
      client: {
        include: {
          coach: { include: { user: { select: { id: true, name: true, lastName: true, status: true } } } },
        },
      },
    },
  });
  if (!user) {
    throw new UnauthorizedError('Usuario no encontrado');
  }
  if (isUserBlocked(user.status)) {
    throw new UnauthorizedError(BLOCKED_ERROR);
  }
  if (user.role === 'coach' && user.coach?.deletedAt) {
    throw new UnauthorizedError(BLOCKED_ERROR);
  }
  if (user.role === 'cliente' && user.client?.coach) {
    const ch = user.client.coach;
    if (ch.deletedAt || isUserBlocked(ch.user?.status)) {
      throw new UnauthorizedError(BLOCKED_ERROR);
    }
  }
  const { passwordHash: _, ...safe } = user;
  return formatUser(safe);
}

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      tv: user.tokenVersion ?? 0,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export const userSelect = {
  id: true,
  username: true,
  email: true,
  name: true,
  lastName: true,
  role: true,
  status: true,
  createdAt: true,
  tokenVersion: true,
};

export function formatUser(u) {
  const base = {
    id: u.id,
    username: u.username,
    email: u.email ?? null,
    name: u.name,
    lastName: u.lastName,
    role: u.role,
    status: u.status,
    active: u.status === 'active',
    createdAt: u.createdAt,
  };
  if (u.role === 'coach' && u.coach) {
    base.coachId = u.coach.id;
    base.createdById = u.createdById ?? null;
    base.specialty = u.coach.specialty;
    base.subscriptionPlan = u.coach.subscriptionPlan || 'basico';
    base.subscriptionStatus = u.coach.subscriptionStatus || 'activa';
  }
  if (u.role === 'cliente' && u.client) {
    base.clientId = u.client.id;
    base.coachId = u.client.coachId;
    base.coachUserId = u.client.coach?.userId ?? null;
    base.subscriptionPlan = u.client.coach?.subscriptionPlan || 'basico';
    base.age = u.client.age;
    base.weight = u.client.weight;
    base.height = u.client.height;
    base.objective = u.client.objective;
    base.objectiveDescription = u.client.objectiveDescription;
    base.level = u.client.level;
    if (u.client.coach?.user) {
      const cu = u.client.coach.user;
      base.coachUser = { id: cu.id, name: cu.name, lastName: cu.lastName };
    }
  }
  return base;
}
