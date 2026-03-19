import { prisma } from '../utils/prisma.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

export async function listExercises(filters = {}, coachId = null) {
  const { search, muscleGroup, scope } = filters;
  const where = { status: 'active' };
  if (search) {
    where.name = { contains: search };
  }
  if (muscleGroup) {
    where.muscleGroup = muscleGroup;
  }
  if (scope === 'coach' && coachId) {
    where.OR = [{ scope: 'global' }, { createdById: coachId, scope: 'coach' }];
  } else if (scope === 'global') {
    where.scope = 'global';
  }
  const exercises = await prisma.exerciseLibrary.findMany({
    where,
    orderBy: { name: 'asc' },
  });
  return exercises;
}

export async function getExerciseById(id) {
  const ex = await prisma.exerciseLibrary.findUnique({ where: { id } });
  if (!ex) throw new NotFoundError('Ejercicio');
  return ex;
}

export async function createExercise(data, createdById = null, scope = 'global') {
  return prisma.exerciseLibrary.create({
    data: {
      name: data.name,
      description: data.description || null,
      instructions: data.instructions || null,
      muscleGroup: data.muscleGroup || null,
      equipment: data.equipment || null,
      caloriasPorRep: data.caloriasPorRep ? parseFloat(data.caloriasPorRep) : null,
      caloriasPorMin: data.caloriasPorMin ? parseFloat(data.caloriasPorMin) : null,
      videoUrl: data.videoUrl || null,
      createdById: scope === 'coach' ? createdById : null,
      scope,
    },
  });
}

export async function updateExercise(id, data, coachId = null) {
  const ex = await prisma.exerciseLibrary.findUnique({ where: { id } });
  if (!ex) throw new NotFoundError('Ejercicio');
  if (ex.scope === 'coach' && ex.createdById !== coachId) {
    throw new ForbiddenError('No puedes editar este ejercicio');
  }
  return prisma.exerciseLibrary.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name : undefined,
      description: data.description !== undefined ? data.description : undefined,
      instructions: data.instructions !== undefined ? data.instructions : undefined,
      muscleGroup: data.muscleGroup !== undefined ? data.muscleGroup : undefined,
      equipment: data.equipment !== undefined ? data.equipment : undefined,
      caloriasPorRep: data.caloriasPorRep !== undefined ? (data.caloriasPorRep ? parseFloat(data.caloriasPorRep) : null) : undefined,
      caloriasPorMin: data.caloriasPorMin !== undefined ? (data.caloriasPorMin ? parseFloat(data.caloriasPorMin) : null) : undefined,
      videoUrl: data.videoUrl !== undefined ? data.videoUrl : undefined,
    },
  });
}

export async function deleteExercise(id, coachId = null) {
  const ex = await prisma.exerciseLibrary.findUnique({ where: { id } });
  if (!ex) throw new NotFoundError('Ejercicio');
  if (ex.scope === 'coach' && ex.createdById !== coachId) {
    throw new ForbiddenError('No puedes eliminar este ejercicio');
  }
  await prisma.exerciseLibrary.update({
    where: { id },
    data: { status: 'inactive' },
  });
  return { success: true };
}
