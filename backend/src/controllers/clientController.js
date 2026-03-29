import * as clientService from '../services/clientService.js';

export async function listByCoach(req, res, next) {
  try {
    const coachId = req.user.coach?.id;
    if (!coachId) return res.status(403).json({ success: false, error: 'No eres coach' });
    const raw = req.query?.expand;
    const expand = typeof raw === 'string' ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const clients = await clientService.listClientsByCoach(coachId, { expand });
    res.json({ success: true, data: clients });
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const coachId = req.user.coach?.id;
    const clientId = req.user.client?.id;
    if (req.userRole === 'cliente' && clientId !== req.params.id) {
      return res.status(403).json({ success: false, error: 'Acceso denegado' });
    }
    const client = await clientService.getClientById(req.params.id, req.userRole === 'coach' ? coachId : null);
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const coachId = req.user.coach?.id;
    if (!coachId) return res.status(403).json({ success: false, error: 'No eres coach' });
    const client = await clientService.createClient(coachId, req.body);
    res.status(201).json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const coachId = req.user?.coach?.id;
    const clientId = req.user?.client?.id;
    const isOwnProfile = req.userRole === 'cliente' && clientId === req.params.id;
    if (!coachId && !isOwnProfile) return res.status(403).json({ success: false, error: 'Acceso denegado' });
    const client = await clientService.updateClient(req.params.id, coachId || (isOwnProfile ? 'self' : null), req.body);
    res.json({ success: true, data: client });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    if (req.userRole !== 'coach' || !req.user.coach?.id) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para esta acción' });
    }
    await clientService.deleteClient(req.params.id, req.user);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
