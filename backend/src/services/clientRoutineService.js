import { prisma } from '../utils/prisma.js';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ServiceUnavailableError,
} from '../utils/errors.js';
import { formatRoutine } from './routineService.js';

const clientRoutineExerciseInclude = {
  exercise: true,
  exerciseSets: { orderBy: { setNumber: 'asc' } },
};

const assignmentFullInclude = {
  routine: {
    include: {
      routineExercises: {
        include: { exercise: true },
        orderBy: [{ sessionIndex: 'asc' }, { orderIndex: 'asc' }],
      },
    },
  },
  clientRoutineExercises: {
    include: clientRoutineExerciseInclude,
    orderBy: [{ sessionIndex: 'asc' }, { orderIndex: 'asc' }],
  },
};

/** Solo rutina plantilla (sin tablas de instancia por cliente). */
const assignmentRoutineOnlyInclude = {
  routine: assignmentFullInclude.routine,
};

/**
 * BD sin migración de instancias: Prisma/MySQL falla al incluir `clientRoutineExercises`.
 * Evitamos 500 en /api/routines devolviendo la vista de plantilla hasta que existan las tablas.
 */
function isCloneSchemaUnavailableError(err) {
  const code = err?.code;
  const msg = String(err?.message || '').toLowerCase();
  if (code === 'P2010') return true;
  if (code === 'P2021') return true; // tabla no existe en BD (migración no aplicada)
  if (msg.includes("doesn't exist") || msg.includes('does not exist')) return true;
  if (msg.includes('unknown table')) return true;
  if (msg.includes('1146')) return true;
  if (msg.includes('client_routine_exercise')) return true;
  return false;
}

/**
 * Normaliza pesos por RoutineExercise.id (plantilla). Valores no numéricos → null.
 * @param {unknown} raw
 * @param {{ id: string, sets: number }[]} routineExercises
 */
function normalizeExerciseSetWeightsMap(raw, routineExercises) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  /** @type {Record<string, (number | null)[]>} */
  const out = {};
  for (const re of routineExercises) {
    const arr = raw[re.id];
    if (!Array.isArray(arr)) continue;
    const n = Math.max(1, parseInt(String(re.sets), 10) || 3);
    const slice = arr.slice(0, n).map((v) => {
      if (v === '' || v == null) return null;
      const f = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
      return Number.isFinite(f) ? f : null;
    });
    while (slice.length < n) slice.push(null);
    out[re.id] = slice;
  }
  return out;
}

async function cloneExercisesIntoAssignment(tx, clientRoutineId, routineExercises, weightsBySourceId) {
  for (const re of routineExercises) {
    const nSets = Math.max(1, parseInt(String(re.sets), 10) || 3);
    const weights = weightsBySourceId[re.id] || [];
    await tx.clientRoutineExercise.create({
      data: {
        clientRoutineId,
        sourceRoutineExerciseId: re.id,
        exerciseId: re.exerciseId,
        customName: re.customName,
        description: re.description,
        instructions: re.instructions,
        rest: re.rest,
        videoUrl: re.videoUrl,
        orderIndex: re.orderIndex,
        sessionIndex: re.sessionIndex ?? 1,
        notes: re.notes,
        caloriasPorRep: re.caloriasPorRep,
        caloriasPorMin: re.caloriasPorMin,
        time: re.time,
        exerciseSets: {
          create: [...Array(nSets)].map((_, i) => ({
            setNumber: i + 1,
            reps: re.reps,
            assignedWeight:
              weights[i] != null && weights[i] !== '' && Number.isFinite(Number(weights[i]))
                ? parseFloat(String(weights[i]))
                : null,
          })),
        },
      },
    });
  }
}

/**
 * Asignaciones legacy sin filas clonadas: genera snapshot desde la plantilla actual.
 */
export async function ensureClonedExercisesForAssignment(assignmentId) {
  const cr = await prisma.clientRoutine.findUnique({
    where: { id: assignmentId },
    include: {
      clientRoutineExercises: { select: { id: true } },
      routine: {
        include: {
          routineExercises: { orderBy: [{ sessionIndex: 'asc' }, { orderIndex: 'asc' }] },
        },
      },
    },
  });
  if (!cr) return null;
  if (cr.clientRoutineExercises.length > 0) {
    return prisma.clientRoutine.findUnique({
      where: { id: assignmentId },
      include: assignmentFullInclude,
    });
  }
  const template = cr.routine.routineExercises || [];
  if (!template.length) {
    return prisma.clientRoutine.findUnique({
      where: { id: assignmentId },
      include: assignmentFullInclude,
    });
  }

  await prisma.$transaction(async (tx) => {
    await cloneExercisesIntoAssignment(tx, cr.id, template, {});
  });

  return prisma.clientRoutine.findUnique({
    where: { id: assignmentId },
    include: assignmentFullInclude,
  });
}

/**
 * @param {import('@prisma/client').ClientRoutine & { routine: object, clientRoutineExercises: object[] }} assignment
 */
export function formatRoutineForClientView(assignment) {
  const base = formatRoutine(assignment.routine);
  const clones = assignment.clientRoutineExercises || [];
  if (!clones.length) {
    return { ...base, clientRoutineId: assignment.id, usesClientInstance: false };
  }

  const templateExercises = assignment.routine?.routineExercises || [];
  const exercises = clones.map((cre) => {
    const templateRe =
      cre.sourceRoutineExerciseId &&
      templateExercises.find((re) => re.id === cre.sourceRoutineExerciseId);

    let exerciseSets = (cre.exerciseSets || []).map((s) => ({
      id: s.id,
      setNumber: s.setNumber,
      reps: s.reps,
      assignedWeight: s.assignedWeight,
    }));

    if (exerciseSets.length === 0 && templateRe) {
      const n = Math.max(1, parseInt(String(templateRe.sets), 10) || 3);
      exerciseSets = Array.from({ length: n }, (_, i) => ({
        id: `syn-${cre.id}-${i + 1}`,
        setNumber: i + 1,
        reps: templateRe.reps,
        assignedWeight: null,
      }));
    }

    const name = cre.exercise?.name || cre.customName || 'Ejercicio';
    const sets = Math.max(1, exerciseSets.length || parseInt(String(templateRe?.sets), 10) || 1);
    const firstReps = exerciseSets[0]?.reps ?? templateRe?.reps ?? null;

    return {
      id: cre.id,
      clientRoutineExerciseId: cre.id,
      sourceRoutineExerciseId: cre.sourceRoutineExerciseId,
      exerciseId: cre.exerciseId,
      name,
      customName: cre.customName,
      description: cre.description,
      instructions: cre.instructions,
      sets,
      reps: firstReps,
      time: cre.time,
      rest: cre.rest,
      caloriasPorRep: cre.caloriasPorRep,
      caloriasPorMin: cre.caloriasPorMin,
      videoUrl: cre.videoUrl || cre.exercise?.videoUrl,
      muscleGroup: cre.exercise?.muscleGroup || null,
      order: cre.orderIndex,
      sessionIndex: cre.sessionIndex ?? 1,
      observations: cre.notes,
      exerciseSets,
    };
  });

  return {
    ...base,
    exercises,
    clientRoutineId: assignment.id,
    usesClientInstance: true,
  };
}

export async function findActiveAssignmentForClientRoutine(clientId, routineId) {
  const where = { clientId, routineId, active: true };
  let a;
  let skippedCloneInclude = false;
  try {
    a = await prisma.clientRoutine.findFirst({
      where,
      include: assignmentFullInclude,
    });
  } catch (err) {
    if (!isCloneSchemaUnavailableError(err)) throw err;
    skippedCloneInclude = true;
    a = await prisma.clientRoutine.findFirst({
      where,
      include: assignmentRoutineOnlyInclude,
    });
  }
  if (!a) return null;

  if (skippedCloneInclude) {
    return { ...a, clientRoutineExercises: [] };
  }

  if (!a.clientRoutineExercises?.length) {
    try {
      const ensured = await ensureClonedExercisesForAssignment(a.id);
      if (ensured) return ensured;
    } catch (err2) {
      if (isCloneSchemaUnavailableError(err2)) {
        return { ...a, clientRoutineExercises: [] };
      }
      throw err2;
    }
  }

  return a;
}

/**
 * Vista fusionada rutina + instancia cliente (coach o cliente).
 * @param {string} clientProfileId
 * @param {string} routineId
 */
export async function getMergedRoutineForClientProfile(clientProfileId, routineId) {
  const a = await findActiveAssignmentForClientRoutine(clientProfileId, routineId);
  if (!a) return null;
  return formatRoutineForClientView(a);
}

/**
 * @param {{ assignmentDate?: string, exerciseSetWeights?: Record<string, unknown> }} options
 */
export async function assignRoutine(clientId, routineId, coachId, assignedById, options = {}) {
  const { assignmentDate, exerciseSetWeights } = options;
  const [client, routine] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientId } }),
    prisma.routine.findUnique({
      where: { id: routineId },
      include: {
        routineExercises: { orderBy: [{ sessionIndex: 'asc' }, { orderIndex: 'asc' }] },
      },
    }),
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
  const weightsMap = normalizeExerciseSetWeightsMap(
    exerciseSetWeights,
    routine.routineExercises || []
  );

  try {
    await prisma.$transaction(async (tx) => {
      const created = await tx.clientRoutine.create({
        data: {
          clientId,
          routineId,
          assignedById: assignedById || coachId,
          active: true,
          startDate,
        },
      });
      await cloneExercisesIntoAssignment(
        tx,
        created.id,
        routine.routineExercises || [],
        weightsMap
      );
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
    return await listClientRoutines(clientId, coachId);
  } catch (err) {
    if (isCloneSchemaUnavailableError(err)) {
      throw new ServiceUnavailableError(
        'No se pueden asignar rutinas con pesos por serie porque en el servidor faltan las tablas ' +
          '`client_routine_exercises` / `client_routine_exercise_sets`. Aplicá las migraciones en el backend ' +
          '(por ejemplo `npx prisma migrate deploy` en la carpeta del API) y volvé a intentar.'
      );
    }
    throw err;
  }
}

export async function listClientRoutines(clientId, coachId = null) {
  const where = { clientId };
  if (coachId) {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client || client.coachId !== coachId) throw new ForbiddenError('Acceso denegado');
  }

  let assignments;
  let skippedCloneInclude = false;
  try {
    assignments = await prisma.clientRoutine.findMany({
      where,
      include: {
        routine: {
          include: {
            routineExercises: { include: { exercise: true }, orderBy: [{ sessionIndex: 'asc' }, { orderIndex: 'asc' }] },
          },
        },
        clientRoutineExercises: {
          include: clientRoutineExerciseInclude,
          orderBy: [{ sessionIndex: 'asc' }, { orderIndex: 'asc' }],
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  } catch (err) {
    if (!isCloneSchemaUnavailableError(err)) throw err;
    skippedCloneInclude = true;
    assignments = await prisma.clientRoutine.findMany({
      where,
      include: assignmentRoutineOnlyInclude,
      orderBy: { assignedAt: 'desc' },
    });
  }

  const enriched = [];
  for (const a of assignments) {
    let row = skippedCloneInclude ? { ...a, clientRoutineExercises: [] } : a;
    if (!skippedCloneInclude && a.active && (!a.clientRoutineExercises || a.clientRoutineExercises.length === 0)) {
      try {
        const ensured = await ensureClonedExercisesForAssignment(a.id);
        if (ensured) row = ensured;
      } catch (err2) {
        if (isCloneSchemaUnavailableError(err2)) {
          row = { ...a, clientRoutineExercises: [] };
        } else {
          throw err2;
        }
      }
    }
    enriched.push(row);
  }

  return enriched.map((a) => ({
    id: a.id,
    clientId: a.clientId,
    routineId: a.routineId,
    assignedAt: a.assignedAt,
    active: a.active,
    routine: formatRoutine(a.routine),
    /** Vista con pesos por cliente; mismo shape que routinesApi para el alumno */
    clientRoutine: formatRoutineForClientView(a),
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

/**
 * @param {string} assignmentId - ClientRoutine.id
 * @param {string} coachId
 */
export async function getAssignmentDetailForCoach(assignmentId, coachId) {
  let cr;
  let skippedCloneInclude = false;
  try {
    cr = await prisma.clientRoutine.findFirst({
      where: { id: assignmentId, active: true },
      include: { client: true, ...assignmentFullInclude },
    });
  } catch (err) {
    if (!isCloneSchemaUnavailableError(err)) throw err;
    skippedCloneInclude = true;
    cr = await prisma.clientRoutine.findFirst({
      where: { id: assignmentId, active: true },
      include: { client: true, ...assignmentRoutineOnlyInclude },
    });
  }
  if (!cr) throw new NotFoundError('Asignación');
  if (cr.client.coachId !== coachId) throw new ForbiddenError('Acceso denegado');
  let row = skippedCloneInclude ? { ...cr, clientRoutineExercises: [] } : cr;
  if (!skippedCloneInclude && !cr.clientRoutineExercises?.length) {
    try {
      const ensured = await ensureClonedExercisesForAssignment(cr.id);
      if (ensured) row = ensured;
    } catch (err2) {
      if (isCloneSchemaUnavailableError(err2)) {
        row = { ...cr, clientRoutineExercises: [] };
      } else {
        throw err2;
      }
    }
  }
  return {
    id: row.id,
    clientId: row.clientId,
    routineId: row.routineId,
    assignedAt: row.assignedAt,
    active: row.active,
    routine: formatRoutineForClientView(row),
  };
}

/**
 * @param {string} assignmentId
 * @param {string} clientProfileId
 */
export async function getAssignmentDetailForClient(assignmentId, clientProfileId) {
  let cr;
  let skippedCloneInclude = false;
  try {
    cr = await prisma.clientRoutine.findFirst({
      where: { id: assignmentId, clientId: clientProfileId, active: true },
      include: assignmentFullInclude,
    });
  } catch (err) {
    if (!isCloneSchemaUnavailableError(err)) throw err;
    skippedCloneInclude = true;
    cr = await prisma.clientRoutine.findFirst({
      where: { id: assignmentId, clientId: clientProfileId, active: true },
      include: assignmentRoutineOnlyInclude,
    });
  }
  if (!cr) throw new NotFoundError('Asignación');
  let row = skippedCloneInclude ? { ...cr, clientRoutineExercises: [] } : cr;
  if (!skippedCloneInclude && !cr.clientRoutineExercises?.length) {
    try {
      const ensured = await ensureClonedExercisesForAssignment(cr.id);
      if (ensured) row = ensured;
    } catch (err2) {
      if (isCloneSchemaUnavailableError(err2)) {
        row = { ...cr, clientRoutineExercises: [] };
      } else {
        throw err2;
      }
    }
  }
  return {
    id: row.id,
    clientId: row.clientId,
    routineId: row.routineId,
    assignedAt: row.assignedAt,
    active: row.active,
    routine: formatRoutineForClientView(row),
  };
}

/**
 * @param {string} assignmentId
 * @param {string} coachId
 * @param {{ updates: { clientRoutineExerciseId: string, setWeights: (number|null|string)[] }[] }} body
 */
export async function patchAssignmentSetWeights(assignmentId, coachId, body) {
  const cr = await prisma.clientRoutine.findFirst({
    where: { id: assignmentId, active: true },
    include: {
      client: true,
      clientRoutineExercises: {
        include: { exerciseSets: { orderBy: { setNumber: 'asc' } } },
      },
    },
  });
  if (!cr) throw new NotFoundError('Asignación');
  if (cr.client.coachId !== coachId) throw new ForbiddenError('Acceso denegado');

  const updates = body?.updates;
  if (!Array.isArray(updates)) {
    throw new BadRequestError('Formato inválido');
  }

  const allowedCre = new Set((cr.clientRoutineExercises || []).map((e) => e.id));

  await prisma.$transaction(async (tx) => {
    for (const u of updates) {
      const creId = u.clientRoutineExerciseId;
      if (!creId || !allowedCre.has(creId)) continue;
      const cre = cr.clientRoutineExercises.find((e) => e.id === creId);
      if (!cre) continue;
      const weights = Array.isArray(u.setWeights) ? u.setWeights : [];
      for (const setRow of cre.exerciseSets || []) {
        const w = weights[setRow.setNumber - 1];
        if (w === undefined) continue;
        let next = null;
        if (w !== '' && w != null && String(w).trim() !== '') {
          const f = typeof w === 'number' ? w : parseFloat(String(w).replace(',', '.'));
          next = Number.isFinite(f) ? f : null;
        }
        await tx.clientRoutineExerciseSet.update({
          where: { id: setRow.id },
          data: { assignedWeight: next },
        });
      }
    }
  });

  return getAssignmentDetailForCoach(assignmentId, coachId);
}

/**
 * @param {string} assignmentId
 * @param {string} clientProfileId
 * @param {{ updates: { clientRoutineExerciseId: string, setWeights: (number|null|string)[] }[] }} body
 */
export async function patchAssignmentSetWeightsAsClient(assignmentId, clientProfileId, body) {
  const cr = await prisma.clientRoutine.findFirst({
    where: { id: assignmentId, clientId: clientProfileId, active: true },
    include: {
      clientRoutineExercises: {
        include: { exerciseSets: { orderBy: { setNumber: 'asc' } } },
      },
    },
  });
  if (!cr) throw new NotFoundError('Asignación');

  const updates = body?.updates;
  if (!Array.isArray(updates)) {
    throw new BadRequestError('Formato inválido');
  }

  const allowedCre = new Set((cr.clientRoutineExercises || []).map((e) => e.id));

  await prisma.$transaction(async (tx) => {
    for (const u of updates) {
      const creId = u.clientRoutineExerciseId;
      if (!creId || !allowedCre.has(creId)) continue;
      const cre = cr.clientRoutineExercises.find((e) => e.id === creId);
      if (!cre) continue;
      const weights = Array.isArray(u.setWeights) ? u.setWeights : [];
      for (const setRow of cre.exerciseSets || []) {
        const w = weights[setRow.setNumber - 1];
        if (w === undefined) continue;
        let next = null;
        if (w !== '' && w != null && String(w).trim() !== '') {
          const f = typeof w === 'number' ? w : parseFloat(String(w).replace(',', '.'));
          next = Number.isFinite(f) ? f : null;
        }
        await tx.clientRoutineExerciseSet.update({
          where: { id: setRow.id },
          data: { assignedWeight: next },
        });
      }
    }
  });

  return getAssignmentDetailForClient(assignmentId, clientProfileId);
}
