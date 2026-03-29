import * as exerciseService from '../services/exerciseLibraryService.js';

export async function list(req, res, next) {
  try {
    const coachId = req.user?.coach?.id || null;
    const exercises = await exerciseService.listExercises(req.query, coachId);
    res.json({ success: true, data: exercises });
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const exercise = await exerciseService.getExerciseById(req.params.id, {
      role: req.userRole,
      coachId: req.user?.coach?.id ?? null,
      clientCoachId: req.user?.client?.coachId ?? null,
    });
    res.json({ success: true, data: exercise });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const coachId = req.user?.coach?.id || null;
    const scope = req.userRole === 'admin' ? 'global' : 'coach';
    const exercise = await exerciseService.createExercise(req.body, coachId, scope);
    res.status(201).json({ success: true, data: exercise });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const coachId = req.user?.coach?.id || null;
    const exercise = await exerciseService.updateExercise(req.params.id, req.body, coachId);
    res.json({ success: true, data: exercise });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const coachId = req.user?.coach?.id || null;
    await exerciseService.deleteExercise(req.params.id, coachId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
