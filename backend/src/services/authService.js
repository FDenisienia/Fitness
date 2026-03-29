import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';
import { config } from '../config/index.js';
import { UnauthorizedError, BadRequestError } from '../utils/errors.js';
import { isUserBlocked } from '../utils/userStatus.js';

const SALT_ROUNDS = 10;

export async function register(data) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existing) {
    throw new BadRequestError('Ya existe un usuario con ese email');
  }
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      lastPasswordPlain: data.password,
      name: data.name,
      lastName: data.lastName || null,
      role: 'cliente',
      status: 'active',
      tokenVersion: 0,
    },
    select: userSelect,
  });
  const { tokenVersion: _tv, ...publicUser } = user;
  return { user: publicUser, token: generateToken(user) };
}

const CREDENTIALS_ERROR = 'Email o contraseña incorrectos';
const BLOCKED_ERROR = 'Usuario bloqueado';

export async function login(email, password) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
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
    throw new UnauthorizedError(CREDENTIALS_ERROR);
  }
  if (isUserBlocked(user.status)) {
    throw new UnauthorizedError(BLOCKED_ERROR);
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
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
  const { passwordHash: _, lastPasswordPlain: __lp, ...safeUser } = user;
  return { user: formatUser(safeUser), token: generateToken(safeUser) };
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
  const { passwordHash: _, lastPasswordPlain: __lp, ...safe } = user;
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

const userSelect = {
  id: true,
  email: true,
  name: true,
  lastName: true,
  role: true,
  status: true,
  createdAt: true,
  tokenVersion: true,
};

function formatUser(u) {
  const base = {
    id: u.id,
    email: u.email,
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
