import * as routineService from '../services/routineService.js';
import * as clientRoutineService from '../services/clientRoutineService.js';
import * as clientService from '../services/clientService.js';

export async function list(req, res, next) {
  try {
    const coachId = req.user?.coach?.id;
    const clientId = req.user?.client?.id;
    if (req.userRole === 'admin') {
      const routines = await routineService.listAllRoutines();
      return res.json({ success: true, data: routines });
    }
    if (req.userRole === 'coach' && coachId) {
      const routines = await routineService.listRoutinesByCoach(coachId);
      return res.json({ success: true, data: routines });
    }
    if (req.userRole === 'cliente' && clientId) {
      const assignments = await clientRoutineService.listClientRoutines(clientId);
      const routines = assignments.filter((a) => a.active).map((a) => a.clientRoutine);
      return res.json({ success: true, data: routines });
    }
    res.json({ success: true, data: [] });
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const coachId = req.user?.coach?.id;
    const clientId = req.user?.client?.id;
    const forClientProfileId =
      typeof req.query.forClient === 'string' && req.query.forClient.trim()
        ? req.query.forClient.trim()
        : null;

    if (req.userRole === 'coach' && coachId && forClientProfileId) {
      await clientService.getClientById(forClientProfileId, coachId);
      const merged = await clientRoutineService.getMergedRoutineForClientProfile(
        forClientProfileId,
        req.params.id
      );
      if (!merged) {
        return res.status(404).json({ success: false, error: 'Rutina no asignada a este cliente' });
      }
      return res.json({ success: true, data: merged });
    }

    if (req.userRole === 'cliente' && clientId) {
      const assignments = await clientRoutineService.listClientRoutines(clientId);
      const hasAccess = assignments.some((a) => a.routineId === req.params.id && a.active);
      if (!hasAccess) {
        return res.status(403).json({ success: false, error: 'No tienes acceso a esta rutina' });
      }
      const merged = await clientRoutineService.getMergedRoutineForClientProfile(clientId, req.params.id);
      if (!merged) {
        return res.status(404).json({ success: false, error: 'Rutina no encontrada' });
      }
      return res.json({ success: true, data: merged });
    }

    const routine = await routineService.getRoutineById(req.params.id, coachId);
    res.json({ success: true, data: routine });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const coachId = req.user?.coach?.id;
    if (!coachId && req.userRole !== 'admin') return res.status(403).json({ success: false, error: 'No eres coach' });
    // Admin crea rutinas - necesitamos coachId en body. Para coach, usamos el suyo.
    const effectiveCoachId = coachId || req.body.coachId;
    if (!effectiveCoachId) return res.status(400).json({ success: false, error: 'coachId requerido' });
    const routine = await routineService.createRoutine(effectiveCoachId, req.body);
    res.status(201).json({ success: true, data: routine });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const coachId = req.user?.coach?.id;
    const routine = await routineService.getRoutineById(req.params.id, coachId);
    const effectiveCoachId = coachId || (req.userRole === 'admin' ? routine.coachId : null);
    if (!effectiveCoachId) return res.status(403).json({ success: false, error: 'Acceso denegado' });
    const updated = await routineService.updateRoutine(req.params.id, effectiveCoachId, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const coachId = req.user?.coach?.id;
    const routine = await routineService.getRoutineById(req.params.id, coachId);
    const effectiveCoachId = coachId || (req.userRole === 'admin' ? routine.coachId : null);
    if (!effectiveCoachId) return res.status(403).json({ success: false, error: 'Acceso denegado' });
    await routineService.deleteRoutine(req.params.id, effectiveCoachId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
