import * as coachService from '../services/coachService.js';
import * as userDeletionService from '../services/userDeletionService.js';

export async function list(req, res, next) {
  try {
    const coaches = await coachService.listCoaches(null);
    res.json({ success: true, data: coaches });
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const coach = await coachService.getCoachById(req.params.id, null);
    res.json({ success: true, data: coach });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const result = await coachService.createCoach(req.body, req.user.id);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const coach = await coachService.updateCoach(req.params.id, req.body, null);
    res.json({ success: true, data: coach });
  } catch (err) {
    next(err);
  }
}

export async function deactivate(req, res, next) {
  try {
    const coach = await coachService.deactivateCoach(req.params.id, null);
    res.json({ success: true, data: coach });
  } catch (err) {
    next(err);
  }
}

export async function activate(req, res, next) {
  try {
    const coach = await coachService.activateCoach(req.params.id, null);
    res.json({ success: true, data: coach });
  } catch (err) {
    next(err);
  }
}

/** Eliminación dura: alumnos, rutinas, ejercicios del coach, relaciones y User. */
export async function hardDelete(req, res, next) {
  try {
    const result = await userDeletionService.deleteCoachByProfileId(req.user, req.params.id);
    res.json({ success: true, data: result, message: 'Coach y datos relacionados eliminados' });
  } catch (err) {
    next(err);
  }
}

/** Baja lógica (deleted_at); mismo alcance admin que antes. */
export async function softDelete(req, res, next) {
  try {
    const result = await userDeletionService.softDeleteCoachByProfileId(req.user, req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
