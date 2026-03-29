import * as userService from '../services/userService.js';

export async function patchPassword(req, res, next) {
  try {
    await userService.updateUserPassword(req.user, req.params.id, {
      password: req.body.password,
    });
    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const data = await userService.getUsersForViewer(req.user);
    const meta = {
      scope: req.user.role === 'admin' ? 'coaches_created_by_me' : 'my_clients',
      includesInactive: true,
      includesSoftDeletedCoaches: req.user.role === 'admin',
      total: data.length,
    };
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_USERS === '1') {
      console.log('[GET /users]', {
        role: req.user.role,
        total: data.length,
        sampleIds: data.slice(0, 15).map((row) => row.id ?? row.coachId),
      });
    }
    res.json({ success: true, data, meta });
  } catch (err) {
    next(err);
  }
}
