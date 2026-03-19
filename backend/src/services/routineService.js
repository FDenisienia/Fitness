import { prisma } from '../utils/prisma.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

export async function listAllRoutines() {
  const routines = await prisma.routine.findMany({
    include: {
      coach: { include: { user: { select: { id: true, name: true, lastName: true } } } },
      routineExercises: {
        include: { exercise: true },
        orderBy: { orderIndex: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return routines.map((r) => ({ ...formatRoutine(r), createdBy: r.coach?.user?.id, createdByRole: 'coach' }));
}

export async function listRoutinesByCoach(coachId) {
  const routines = await prisma.routine.findMany({
    where: { coachId },
    include: {
      routineExercises: {
        include: { exercise: true },
        orderBy: { orderIndex: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return routines.map(formatRoutine);
}

export async function getRoutineById(id, coachId = null) {
  const routine = await prisma.routine.findUnique({
    where: { id },
    include: {
      routineExercises: {
        include: { exercise: true },
        orderBy: { orderIndex: 'asc' },
      },
    },
  });
  if (!routine) throw new NotFoundError('Rutina');
  if (coachId && routine.coachId !== coachId) {
    throw new ForbiddenError('No tienes acceso a esta rutina');
  }
  return formatRoutine(routine);
}

export async function createRoutine(coachId, data) {
  const routine = await prisma.routine.create({
    data: {
      coachId,
      name: data.name,
      description: data.description || null,
      objective: data.objective || null,
      level: data.level || null,
      frequencyPerWeek: data.frequencyPerWeek ? parseInt(data.frequencyPerWeek, 10) : null,
      durationMinutes: data.durationMinutes ? parseInt(data.durationMinutes, 10) : null,
      daysCount: data.daysCount ? parseInt(data.daysCount, 10) : null,
      stimulus: data.stimulus || data.estimulo || null,
      status: data.status || 'activa',
      recommendations: data.recommendations || null,
      warnings: data.warnings || null,
    },
  });
  if (data.exercises && Array.isArray(data.exercises) && data.exercises.length > 0) {
    await upsertRoutineExercises(routine.id, data.exercises);
  }
  return getRoutineById(routine.id, coachId);
}

export async function updateRoutine(id, coachId, data) {
  await getRoutineById(id, coachId);
  await prisma.routine.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name : undefined,
      description: data.description !== undefined ? data.description : undefined,
      objective: data.objective !== undefined ? data.objective : undefined,
      level: data.level !== undefined ? data.level : undefined,
      frequencyPerWeek: data.frequencyPerWeek !== undefined ? (data.frequencyPerWeek ? parseInt(data.frequencyPerWeek, 10) : null) : undefined,
      durationMinutes: data.durationMinutes !== undefined ? (data.durationMinutes ? parseInt(data.durationMinutes, 10) : null) : undefined,
      daysCount: data.daysCount !== undefined ? (data.daysCount ? parseInt(data.daysCount, 10) : null) : undefined,
      stimulus: data.stimulus !== undefined ? data.stimulus : data.estimulo,
      status: data.status !== undefined ? data.status : undefined,
      recommendations: data.recommendations !== undefined ? data.recommendations : undefined,
      warnings: data.warnings !== undefined ? data.warnings : undefined,
    },
  });
  if (data.exercises && Array.isArray(data.exercises)) {
    await upsertRoutineExercises(id, data.exercises);
  }
  return getRoutineById(id, coachId);
}

export async function deleteRoutine(id, coachId) {
  await getRoutineById(id, coachId);
  await prisma.clientRoutine.deleteMany({ where: { routineId: id } });
  await prisma.plannedWorkout.deleteMany({ where: { routineId: id } });
  await prisma.routine.delete({ where: { id } });
  return { success: true };
}

async function upsertRoutineExercises(routineId, exercises) {
  await prisma.routineExercise.deleteMany({ where: { routineId } });
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    await prisma.routineExercise.create({
      data: {
        routineId,
        exerciseId: ex.exerciseId || ex.id || null,
        customName: ex.customName || ex.name || null,
        description: ex.description || null,
        instructions: ex.instructions || null,
        sets: ex.sets ?? 3,
        reps: ex.reps || null,
        time: ex.time || null,
        rest: ex.rest || null,
        caloriasPorRep: ex.caloriasPorRep ? parseFloat(ex.caloriasPorRep) : null,
        caloriasPorMin: ex.caloriasPorMin ? parseFloat(ex.caloriasPorMin) : null,
        videoUrl: ex.videoUrl || null,
        orderIndex: ex.order ?? i,
        notes: ex.observations || ex.notes || null,
      },
    });
  }
}

function formatRoutine(r) {
  return {
    id: r.id,
    coachId: r.coachId,
    name: r.name,
    description: r.description,
    objective: r.objective,
    level: r.level,
    frequencyPerWeek: r.frequencyPerWeek,
    durationMinutes: r.durationMinutes,
    daysCount: r.daysCount,
    stimulus: r.stimulus,
    estimulo: r.stimulus,
    status: r.status,
    recommendations: r.recommendations,
    warnings: r.warnings,
    createdAt: r.createdAt,
    exercises: (r.routineExercises || []).map((re) => ({
      id: re.id,
      exerciseId: re.exerciseId,
      name: re.exercise?.name || re.customName,
      customName: re.customName,
      description: re.description,
      instructions: re.instructions,
      sets: re.sets,
      reps: re.reps,
      time: re.time,
      rest: re.rest,
      caloriasPorRep: re.caloriasPorRep,
      caloriasPorMin: re.caloriasPorMin,
      videoUrl: re.videoUrl || re.exercise?.videoUrl,
      order: re.orderIndex,
      observations: re.notes,
    })),
  };
}
