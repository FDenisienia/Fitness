import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

const SALT_ROUNDS = 10;

function formatCoach(c) {
  const u = c.user || {};
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
    clientsCount: c._count?.clients ?? 0,
    routinesCount: c._count?.routines ?? 0,
    user: u.id ? { id: u.id, email: u.email, name: u.name, lastName: u.lastName, status: u.status } : undefined,
  };
}

export async function listCoaches() {
  const coaches = await prisma.coach.findMany({
    include: {
      user: { select: { id: true, email: true, name: true, lastName: true, status: true } },
      _count: { select: { clients: true, routines: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return coaches.map(formatCoach);
}

export async function getCoachById(id) {
  const coach = await prisma.coach.findUnique({
    where: { id },
    include: {
      user: true,
      _count: { select: { clients: true, routines: true } },
    },
  });
  if (!coach) throw new NotFoundError('Coach');
  return formatCoach(coach);
}

export async function createCoach(data) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existing) throw new BadRequestError('Ya existe un usuario con ese email');

  const passwordHash = await bcrypt.hash(data.password || 'coach123', SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      name: data.name,
      lastName: data.lastName || null,
      role: 'coach',
      status: 'active',
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
  return { coach: formatCoach(coach), user: { ...safeUser } };
}

export async function updateCoach(id, data) {
  const coach = await prisma.coach.findUnique({ where: { id }, include: { user: true } });
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
  return getCoachById(id);
}
