import { prisma } from '../utils/prisma.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';

/** @param {unknown} raw */
function parseSessionNames(raw) {
  if (raw == null) return {};
  if (typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    const idx = parseInt(String(k), 10);
    if (Number.isNaN(idx) || idx < 1) continue;
    out[String(idx)] = typeof v === 'string' ? v.trim() : '';
  }
  return out;
}

function getSessionIndicesFromExercises(exercises) {
  const set = new Set();
  for (const ex of exercises || []) {
    const si =
      ex.sessionIndex != null && ex.sessionIndex !== ''
        ? Math.max(1, parseInt(String(ex.sessionIndex), 10) || 1)
        : 1;
    set.add(si);
  }
  return [...set].sort((a, b) => a - b);
}

/** @param {Record<string, string>} merged @param {object[]} exercises */
function finalizeSessionNamesForStorage(merged, exercises) {
  const indices = getSessionIndicesFromExercises(exercises);
  const out = {};
  for (const n of indices) {
    const raw = merged[String(n)] ?? merged[n];
    const trimmed = raw != null ? String(raw).trim() : '';
    if (!trimmed) {
      throw new BadRequestError(`El nombre de la sesión ${n} es obligatorio`);
    }
    out[String(n)] = trimmed;
  }
  return out;
}

function sessionNamesForDisplay(stored, exercises) {
  const indices = getSessionIndicesFromExercises(exercises);
  const base = parseSessionNames(stored);
  const out = {};
  for (const n of indices) {
    const v = base[String(n)] ?? base[n];
    if (v && String(v).trim()) out[String(n)] = String(v).trim();
    else out[String(n)] = `Sesión ${n}`;
  }
  return out;
}

/** Orden relativo por sesión: agrupa en orden de aparición y aplana por sessionIndex ascendente. */
function normalizeExercisesForUpsert(exercises) {
  if (!exercises?.length) return [];
  const bySession = new Map();
  for (const ex of exercises) {
    const si =
      ex.sessionIndex != null && ex.sessionIndex !== ''
        ? Math.max(1, parseInt(String(ex.sessionIndex), 10) || 1)
        : 1;
    if (!bySession.has(si)) bySession.set(si, []);
    bySession.get(si).push(ex);
  }
  const keys = [...bySession.keys()].sort((a, b) => a - b);
  const out = [];
  for (const si of keys) {
    const list = bySession.get(si);
    list.forEach((ex, idx) => {
      out.push({ ex, sessionIndex: si, orderIndex: idx });
    });
  }
  return out;
}

export async function listAllRoutines() {
  const routines = await prisma.routine.findMany({
    include: {
      coach: { include: { user: { select: { id: true, name: true, lastName: true } } } },
      routineExercises: {
        include: { exercise: true },
        orderBy: [{ sessionIndex: 'asc' }, { orderIndex: 'asc' }],
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
        orderBy: [{ sessionIndex: 'asc' }, { orderIndex: 'asc' }],
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
        orderBy: [{ sessionIndex: 'asc' }, { orderIndex: 'asc' }],
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
  const exercises = data.exercises && Array.isArray(data.exercises) ? data.exercises : [];
  const merged = parseSessionNames(data.sessionNames);
  let sessionNamesToStore = null;
  if (exercises.length > 0) {
    sessionNamesToStore = finalizeSessionNamesForStorage(merged, exercises);
  }

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
      sessionNames: sessionNamesToStore,
    },
  });
  if (exercises.length > 0) {
    await upsertRoutineExercises(routine.id, exercises);
  }
  return getRoutineById(routine.id, coachId);
}

export async function updateRoutine(id, coachId, data) {
  const existing = await prisma.routine.findUnique({
    where: { id },
    include: {
      routineExercises: {
        include: { exercise: true },
        orderBy: [{ sessionIndex: 'asc' }, { orderIndex: 'asc' }],
      },
    },
  });
  if (!existing) throw new NotFoundError('Rutina');
  if (coachId && existing.coachId !== coachId) {
    throw new ForbiddenError('No tienes acceso a esta rutina');
  }

  const existingParsed = parseSessionNames(existing.sessionNames);
  const incomingParsed = data.sessionNames !== undefined ? parseSessionNames(data.sessionNames) : null;
  const merged = { ...existingParsed, ...(incomingParsed || {}) };

  const exercisesPayload = data.exercises !== undefined && Array.isArray(data.exercises) ? data.exercises : null;
  const exercisesForNames =
    exercisesPayload != null
      ? exercisesPayload
      : (existing.routineExercises || []).map((re) => ({
          sessionIndex: re.sessionIndex ?? 1,
          order: re.orderIndex,
        }));

  const shouldUpdateSessionNames =
    data.sessionNames !== undefined || exercisesPayload !== null;

  let sessionNamesToStore = undefined;
  if (shouldUpdateSessionNames) {
    if (getSessionIndicesFromExercises(exercisesForNames).length > 0) {
      sessionNamesToStore = finalizeSessionNamesForStorage(merged, exercisesForNames);
    } else {
      sessionNamesToStore = null;
    }
  }

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
      ...(sessionNamesToStore !== undefined ? { sessionNames: sessionNamesToStore } : {}),
    },
  });
  if (exercisesPayload) {
    await upsertRoutineExercises(id, exercisesPayload);
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
  const normalized = normalizeExercisesForUpsert(exercises);
  for (const { ex, sessionIndex, orderIndex } of normalized) {
    await prisma.routineExercise.create({
      data: {
        routineId,
        exerciseId: ex.exerciseId || null,
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
        orderIndex,
        sessionIndex,
        notes: ex.observations || ex.notes || null,
      },
    });
  }
}

export function formatRoutine(r) {
  const exercises = (r.routineExercises || []).map((re) => ({
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
    muscleGroup: re.exercise?.muscleGroup || null,
    order: re.orderIndex,
    sessionIndex: re.sessionIndex ?? 1,
    observations: re.notes,
  }));

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
    sessionNames: sessionNamesForDisplay(r.sessionNames, exercises),
    createdAt: r.createdAt,
    exercises,
  };
}
