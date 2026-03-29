import { prisma } from '../utils/prisma.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';
import { isValidYoutubeEmbedUrl } from '../utils/youtubeEmbed.js';

function normVideoUrl(url) {
  if (url == null || url === '') return null;
  const t = String(url).trim();
  return t || null;
}

function assertVideoUrl(videoUrl) {
  if (videoUrl !== undefined && videoUrl !== null && videoUrl !== '' && !isValidYoutubeEmbedUrl(String(videoUrl).trim())) {
    throw new BadRequestError('La URL de vídeo debe ser un enlace embed de YouTube (https://www.youtube.com/embed/...)');
  }
}

function parseCal(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function assertCaloriesPair(caloriasPorRep, caloriasPorMin) {
  if (caloriasPorRep != null && caloriasPorMin != null) {
    throw new BadRequestError('Indica solo calorías por repetición o por minuto, no ambas a la vez.');
  }
}

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

/**
 * @param {string} id
 * @param {{ role: string, coachId?: string | null, clientCoachId?: string | null }} viewer
 */
export async function getExerciseById(id, viewer) {
  const ex = await prisma.exerciseLibrary.findUnique({ where: { id } });
  if (!ex) throw new NotFoundError('Ejercicio');
  if (ex.scope === 'coach' && ex.createdById) {
    const { role, coachId, clientCoachId } = viewer;
    if (role === 'admin') return ex;
    if (role === 'coach' && coachId === ex.createdById) return ex;
    if (role === 'cliente' && clientCoachId === ex.createdById) return ex;
    throw new ForbiddenError('No tienes acceso a este ejercicio');
  }
  return ex;
}

export async function createExercise(data, createdById = null, scope = 'global') {
  assertVideoUrl(data.videoUrl);
  const caloriasPorRep = parseCal(data.caloriasPorRep);
  const caloriasPorMin = parseCal(data.caloriasPorMin);
  assertCaloriesPair(caloriasPorRep, caloriasPorMin);
  const videoUrl = normVideoUrl(data.videoUrl);
  return prisma.exerciseLibrary.create({
    data: {
      name: data.name,
      description: data.description || null,
      instructions: data.instructions || null,
      muscleGroup: data.muscleGroup || null,
      equipment: data.equipment || null,
      caloriasPorRep,
      caloriasPorMin,
      videoUrl,
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
  if (data.videoUrl !== undefined) assertVideoUrl(data.videoUrl);
  const nextRep = data.caloriasPorRep !== undefined ? parseCal(data.caloriasPorRep) : ex.caloriasPorRep;
  const nextMin = data.caloriasPorMin !== undefined ? parseCal(data.caloriasPorMin) : ex.caloriasPorMin;
  assertCaloriesPair(nextRep, nextMin);
  return prisma.exerciseLibrary.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name : undefined,
      description: data.description !== undefined ? data.description : undefined,
      instructions: data.instructions !== undefined ? data.instructions : undefined,
      muscleGroup: data.muscleGroup !== undefined ? data.muscleGroup : undefined,
      equipment: data.equipment !== undefined ? data.equipment : undefined,
      caloriasPorRep: data.caloriasPorRep !== undefined ? parseCal(data.caloriasPorRep) : undefined,
      caloriasPorMin: data.caloriasPorMin !== undefined ? parseCal(data.caloriasPorMin) : undefined,
      videoUrl: data.videoUrl !== undefined ? normVideoUrl(data.videoUrl) : undefined,
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
