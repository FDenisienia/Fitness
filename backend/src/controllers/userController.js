import * as userService from '../services/userService.js';
import * as userDeletionService from '../services/userDeletionService.js';

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

/** Admin: eliminación dura por id de User (coach o alumno). */
export async function destroy(req, res, next) {
  try {
    const result = await userDeletionService.deleteUser(req.user, req.params.id);
    res.json({ success: true, data: result, message: 'Usuario eliminado' });
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const data = await userService.getUsersForViewer(req.user);
    const meta = {
      scope: req.user.role === 'admin' ? 'all_coaches' : 'my_clients',
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
