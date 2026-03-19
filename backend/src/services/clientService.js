import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';

const SALT_ROUNDS = 10;

export async function listClientsByCoach(coachId) {
  const clients = await prisma.client.findMany({
    where: { coachId },
    include: {
      user: { select: { id: true, email: true, name: true, lastName: true, status: true } },
      coach: { include: { user: { select: { id: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return clients.map(formatClient);
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

  const passwordHash = await bcrypt.hash(data.password || 'cliente123', 10);
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
      lastName: data.lastName || null,
      role: 'cliente',
      status: 'active',
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
  await prisma.client.update({
    where: { id },
    data: {
      age: data.age !== undefined ? (data.age ? parseInt(data.age, 10) : null) : undefined,
      weight: data.weight !== undefined ? (data.weight ? parseFloat(data.weight) : null) : undefined,
      height: data.height !== undefined ? (data.height ? parseFloat(data.height) : null) : undefined,
      objective: data.objective !== undefined ? data.objective : undefined,
      level: data.level !== undefined ? data.level : undefined,
    },
  });
  if (data.name !== undefined || data.lastName !== undefined) {
    await prisma.user.update({
      where: { id: client.userId },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        lastName: data.lastName !== undefined ? data.lastName : undefined,
      },
    });
  }
  return formatClient(await prisma.client.findUnique({ where: { id }, include: { user: true, coach: { include: { user: { select: { id: true } } } } } }));
}

export async function deleteClient(id, coachId) {
  await getClientById(id, coachId);
  const client = await prisma.client.findUnique({ where: { id }, include: { user: true } });
  await prisma.user.update({ where: { id: client.userId }, data: { status: 'inactive' } });
  return { success: true };
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
    level: c.level,
    createdAt: c.createdAt,
    user: c.user ? {
      id: c.user.id,
      email: c.user.email,
      name: c.user.name,
      lastName: c.user.lastName,
      status: c.user.status,
    } : undefined,
    coach: c.coach,
  };
}
