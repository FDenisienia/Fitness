import * as plannedWorkoutService from '../services/plannedWorkoutService.js';

export async function listByClient(req, res, next) {
  try {
    const coachId = req.user?.coach?.id;
    const clientId = req.user?.client?.id;
    const { clientId: paramClientId } = req.params;
    const effectiveClientId = paramClientId || clientId;
    if (req.userRole === 'cliente' && effectiveClientId !== clientId) {
      return res.status(403).json({ success: false, error: 'Acceso denegado' });
    }
    const workouts = await plannedWorkoutService.listPlannedWorkouts(effectiveClientId, coachId, req.query);
    res.json({ success: true, data: workouts });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const coachId = req.user?.coach?.id;
    if (!coachId) return res.status(403).json({ success: false, error: 'No eres coach' });
    const { clientId } = req.params;
    const workout = await plannedWorkoutService.createPlannedWorkout(clientId, req.body, coachId);
    res.status(201).json({ success: true, data: workout });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const coachId = req.user?.coach?.id;
    const clientId = req.user?.client?.id;
    const workout = await plannedWorkoutService.updatePlannedWorkout(req.params.id, req.body, coachId, clientId);
    res.json({ success: true, data: workout });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const coachId = req.user?.coach?.id;
    if (!coachId) return res.status(403).json({ success: false, error: 'Solo el coach puede eliminar planificaciones' });
    await plannedWorkoutService.deletePlannedWorkout(req.params.id, coachId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
