import * as clientRoutineService from '../services/clientRoutineService.js';

export async function listByClient(req, res, next) {
  try {
    const coachId = req.user?.coach?.id;
    const { clientId } = req.params;
    const assignments = await clientRoutineService.listClientRoutines(clientId, coachId);
    res.json({ success: true, data: assignments });
  } catch (err) {
    next(err);
  }
}

export async function assign(req, res, next) {
  try {
    const coachId = req.user?.coach?.id;
    if (!coachId) return res.status(403).json({ success: false, error: 'No eres coach' });
    const { clientId, routineId } = req.body;
    if (!clientId || !routineId) return res.status(400).json({ success: false, error: 'clientId y routineId requeridos' });
    const assignments = await clientRoutineService.assignRoutine(clientId, routineId, coachId, coachId);
    res.status(201).json({ success: true, data: assignments });
  } catch (err) {
    next(err);
  }
}

export async function unassign(req, res, next) {
  try {
    const coachId = req.user?.coach?.id;
    if (!coachId) return res.status(403).json({ success: false, error: 'No eres coach' });
    const { clientId, routineId } = req.params;
    await clientRoutineService.unassignRoutine(clientId, routineId, coachId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
