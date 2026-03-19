import * as weightLogService from '../services/weightLogService.js';

export async function listByClient(req, res, next) {
  try {
    const coachId = req.user?.coach?.id;
    const clientId = req.user?.client?.id;
    const { clientId: paramClientId } = req.params;
    const effectiveClientId = paramClientId || clientId;
    if (req.userRole === 'cliente' && effectiveClientId !== clientId) {
      return res.status(403).json({ success: false, error: 'Acceso denegado' });
    }
    const logs = await weightLogService.listWeightLogs(effectiveClientId, coachId);
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const coachId = req.user?.coach?.id;
    const clientId = req.user?.client?.id;
    const { clientId: paramClientId } = req.params;
    const effectiveClientId = paramClientId || clientId;
    if (req.userRole === 'cliente' && effectiveClientId !== clientId) {
      return res.status(403).json({ success: false, error: 'Acceso denegado' });
    }
    const log = await weightLogService.createWeightLog(effectiveClientId, req.body, coachId);
    res.status(201).json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const coachId = req.user?.coach?.id;
    const clientId = req.user?.client?.id;
    const { id, clientId: paramClientId } = req.params;
    const effectiveClientId = paramClientId || clientId;
    if (req.userRole === 'cliente' && effectiveClientId !== clientId) {
      return res.status(403).json({ success: false, error: 'Acceso denegado' });
    }
    const log = await weightLogService.updateWeightLog(id, effectiveClientId, req.body, coachId);
    res.json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const coachId = req.user?.coach?.id;
    const clientId = req.user?.client?.id;
    const { clientId: paramClientId } = req.params;
    const effectiveClientId = paramClientId || clientId;
    if (req.userRole === 'cliente' && effectiveClientId !== clientId) {
      return res.status(403).json({ success: false, error: 'Acceso denegado' });
    }
    await weightLogService.deleteWeightLog(req.params.id, effectiveClientId, coachId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
