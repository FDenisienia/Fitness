import { prisma } from '../utils/prisma.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { formatRoutine } from './routineService.js';

/**
 * @param {{ assignmentDate?: string }} options - Fecha YYYY-MM-DD: inicio de asignación y día en el calendario (PlannedWorkout)
 */
export async function assignRoutine(clientId, routineId, coachId, assignedById, options = {}) {
  const { assignmentDate } = options;
  const [client, routine] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId } }),
    prisma.routine.findUnique({ where: { id: routineId } }),
  ]);
  if (!client) throw new NotFoundError('Cliente');
  if (!routine) throw new NotFoundError('Rutina');
  if (client.coachId !== coachId || routine.coachId !== coachId) {
    throw new ForbiddenError('No puedes asignar esta rutina a este cliente');
  }
  const existing = await prisma.clientRoutine.findFirst({
    where: { clientId, routineId, active: true },
  });
  if (existing) throw new ForbiddenError('La rutina ya está asignada a este cliente');

  const startDate = assignmentDate ? new Date(assignmentDate) : new Date();

  await prisma.$transaction(async (tx) => {
    await tx.clientRoutine.create({
      data: {
        clientId,
        routineId,
        assignedById: assignedById || coachId,
        active: true,
        startDate,
      },
    });
    if (assignmentDate) {
      await tx.plannedWorkout.create({
        data: {
          clientId,
          routineId,
          date: new Date(assignmentDate),
        },
      });
    }
  });
  return listClientRoutines(clientId, coachId);
}

export async function listClientRoutines(clientId, coachId = null) {
  const where = { clientId };
  if (coachId) {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client || client.coachId !== coachId) throw new ForbiddenError('Acceso denegado');
  }
  const assignments = await prisma.clientRoutine.findMany({
    where,
    include: {
      routine: {
        include: {
          routineExercises: { include: { exercise: true }, orderBy: { orderIndex: 'asc' } },
        },
      },
    },
    orderBy: { assignedAt: 'desc' },
  });
  return assignments.map((a) => ({
    id: a.id,
    clientId: a.clientId,
    routineId: a.routineId,
    assignedAt: a.assignedAt,
    active: a.active,
    routine: formatRoutine(a.routine),
  }));
}

export async function unassignRoutine(clientId, routineId, coachId) {
  const cr = await prisma.clientRoutine.findFirst({
    where: { clientId, routineId },
    include: { client: true },
  });
  if (!cr) throw new NotFoundError('Asignación');
  if (cr.client.coachId !== coachId) throw new ForbiddenError('Acceso denegado');
  await prisma.clientRoutine.updateMany({
    where: { clientId, routineId },
    data: { active: false, endDate: new Date() },
  });
  await prisma.plannedWorkout.deleteMany({
    where: { clientId, routineId },
  });
  return { success: true };
}
