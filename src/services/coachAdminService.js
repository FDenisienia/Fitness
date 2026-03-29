import { coachesApi } from '../api';

/**
 * Acciones de administración sobre coaches (la lógica de negocio vive en el backend).
 */
export async function deactivateCoachAsAdmin(coachId) {
  const res = await coachesApi.deactivate(coachId);
  return res.data;
}

export async function activateCoachAsAdmin(coachId) {
  const res = await coachesApi.activate(coachId);
  return res.data;
}

/** Baja lógica del coach (sin borrar filas). */
export async function softDeleteCoachAsAdmin(coachId) {
  const res = await coachesApi.softDelete(coachId);
  return res.data;
}

/** Eliminación permanente: alumnos, rutinas, ejercicios del coach y relaciones. */
export async function hardDeleteCoachAsAdmin(coachId) {
  const res = await coachesApi.remove(coachId);
  return res.data;
}
