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
    const { clientId, routineId, assignmentDate, exerciseSetWeights } = req.body;
    if (!clientId || !routineId) {
      return res.status(400).json({ success: false, error: 'clientId y routineId requeridos' });
    }
    const assignments = await clientRoutineService.assignRoutine(clientId, routineId, coachId, coachId, {
      assignmentDate: typeof assignmentDate === 'string' && assignmentDate.trim() ? assignmentDate.trim() : undefined,
      exerciseSetWeights: exerciseSetWeights && typeof exerciseSetWeights === 'object' ? exerciseSetWeights : undefined,
    });
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

export async function getAssignment(req, res, next) {
  try {
    const coachId = req.user?.coach?.id;
    const clientId = req.user?.client?.id;
    const { assignmentId } = req.params;
    if (req.userRole === 'coach' && coachId) {
      const data = await clientRoutineService.getAssignmentDetailForCoach(assignmentId, coachId);
      return res.json({ success: true, data });
    }
    if (req.userRole === 'cliente' && clientId) {
      const data = await clientRoutineService.getAssignmentDetailForClient(assignmentId, clientId);
      return res.json({ success: true, data });
    }
    return res.status(403).json({ success: false, error: 'Acceso denegado' });
  } catch (err) {
    next(err);
  }
}

export async function patchSetWeights(req, res, next) {
  try {
    const coachId = req.user?.coach?.id;
    const clientId = req.user?.client?.id;
    const { assignmentId } = req.params;
    if (req.userRole === 'coach' && coachId) {
      const data = await clientRoutineService.patchAssignmentSetWeights(assignmentId, coachId, req.body);
      return res.json({ success: true, data });
    }
    if (req.userRole === 'cliente' && clientId) {
      const data = await clientRoutineService.patchAssignmentSetWeightsAsClient(assignmentId, clientId, req.body);
      return res.json({ success: true, data });
    }
    return res.status(403).json({ success: false, error: 'Acceso denegado' });
  } catch (err) {
    next(err);
  }
}
