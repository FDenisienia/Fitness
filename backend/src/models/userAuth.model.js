import { prisma } from '../utils/prisma.js';

const authUserInclude = {
  coach: true,
  client: {
    include: {
      coach: { include: { user: { select: { id: true, name: true, lastName: true, status: true } } } },
    },
  },
};

/**
 * @param {string} usernameNormalized
 */
export function findUserByUsernameForAuth(usernameNormalized) {
  return prisma.user.findUnique({
    where: { username: usernameNormalized },
    include: authUserInclude,
  });
}

/**
 * @param {string} usernameNormalized
 */
export function findUsernameTaken(usernameNormalized) {
  return prisma.user.findUnique({
    where: { username: usernameNormalized },
    select: { id: true },
  });
}

/**
 * @param {string} emailLower
 */
export function findEmailTaken(emailLower) {
  return prisma.user.findFirst({
    where: { email: emailLower },
    select: { id: true },
  });
}

/**
 * Coach activo (no eliminado) por id de perfil Coach.
 * @param {string} coachProfileId
 */
export function findCoachProfileForClientRegistration(coachProfileId) {
  return prisma.coach.findFirst({
    where: { id: coachProfileId, deletedAt: null },
    select: { id: true, userId: true, deletedAt: true },
  });
}

export async function createCoachUserInTransaction(tx, userData, coachData) {
  const created = await tx.user.create({ data: userData });
  await tx.coach.create({
    data: {
      userId: created.id,
      ...coachData,
    },
  });
  return tx.user.findUnique({
    where: { id: created.id },
    include: authUserInclude,
  });
}

export async function createClientUserInTransaction(tx, { userData, clientProfileData }) {
  const created = await tx.user.create({ data: userData });
  await tx.client.create({
    data: {
      userId: created.id,
      ...clientProfileData,
    },
  });
  return tx.user.findUnique({
    where: { id: created.id },
    include: authUserInclude,
  });
}
