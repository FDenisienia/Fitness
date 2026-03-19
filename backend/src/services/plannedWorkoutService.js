import { prisma } from '../utils/prisma.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

export async function listPlannedWorkouts(clientId, coachId = null, filters = {}) {
  if (coachId) {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client || client.coachId !== coachId) throw new ForbiddenError('Acceso denegado');
  }
  const where = { clientId };
  if (filters.from) where.date = { ...where.date, gte: new Date(filters.from) };
  if (filters.to) where.date = { ...where.date, lte: new Date(filters.to) };
  const workouts = await prisma.plannedWorkout.findMany({
    where,
    include: { routine: true },
    orderBy: { date: 'desc' },
  });
  return workouts.map(formatWorkout);
}

export async function createPlannedWorkout(clientId, data, coachId) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client || client.coachId !== coachId) throw new ForbiddenError('Acceso denegado');
  const routine = await prisma.routine.findUnique({ where: { id: data.routineId } });
  if (!routine || routine.coachId !== coachId) throw new NotFoundError('Rutina');

  const workout = await prisma.plannedWorkout.create({
    data: {
      clientId,
      routineId: data.routineId,
      date: new Date(data.date),
      notes: data.notes || null,
    },
    include: { routine: true },
  });
  return formatWorkout(workout);
}

export async function updatePlannedWorkout(id, data, coachId = null, clientId = null) {
  const workout = await prisma.plannedWorkout.findUnique({
    where: { id },
    include: { client: true },
  });
  if (!workout) throw new NotFoundError('Workout planificado');
  const isCoach = coachId && workout.client.coachId === coachId;
  const isClient = clientId && workout.clientId === clientId;
  if (!isCoach && !isClient) throw new ForbiddenError('Acceso denegado');

  const updated = await prisma.plannedWorkout.update({
    where: { id },
    data: {
      notes: data.notes !== undefined ? data.notes : undefined,
      completed: data.completed !== undefined ? data.completed : undefined,
      completedAt: data.completed ? (data.completedAt ? new Date(data.completedAt) : new Date()) : null,
      rpe: data.rpe !== undefined ? data.rpe : undefined,
      sensations: data.sensations !== undefined ? data.sensations : undefined,
      feedback: data.feedback !== undefined ? data.feedback : undefined,
      clientNotes: data.clientNotes !== undefined ? data.clientNotes : undefined,
    },
    include: { routine: true },
  });
  return formatWorkout(updated);
}

function formatWorkout(w) {
  return {
    id: w.id,
    clientId: w.clientId,
    routineId: w.routineId,
    date: w.date,
    notes: w.notes,
    completed: w.completed,
    completedAt: w.completedAt,
    rpe: w.rpe,
    sensations: w.sensations,
    feedback: w.feedback,
    clientNotes: w.clientNotes,
    routine: w.routine,
  };
}
