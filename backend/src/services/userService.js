import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

const SALT_ROUNDS = 10;

export async function listUsers(filters = {}) {
  const { role, status, search } = filters;
  const where = {};
  if (role) where.role = role;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }
  const users = await prisma.user.findMany({
    where,
    include: {
      coach: true,
      client: { include: { coach: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return users.map((u) => formatUser(u));
}

export async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { coach: true, client: { include: { coach: true } } },
  });
  if (!user) throw new NotFoundError('Usuario');
  return formatUser(user);
}

function formatUser(u) {
  const { passwordHash: _, ...safe } = u;
  const base = { ...safe };
  if (u.coach) base.coachId = u.coach.id;
  if (u.client) base.clientId = u.client.id;
  return base;
}
