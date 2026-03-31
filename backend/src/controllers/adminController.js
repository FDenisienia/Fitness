import * as adminService from '../services/adminService.js';

export async function updateMe(req, res, next) {
  try {
    const { user, token } = await adminService.updateAdminOwnProfile(req.user.id, req.body);
    const payload = { success: true, data: user };
    if (token) payload.token = token;
    res.json(payload);
  } catch (err) {
    next(err);
  }
}

export async function listCoaches(req, res, next) {
  try {
    const coaches = await adminService.listCoachesForAdmin();
    res.json({ success: true, data: coaches });
  } catch (err) {
    next(err);
  }
}

export async function getCoachById(req, res, next) {
  try {
    const coach = await adminService.getCoachDetailForAdmin(req.params.id);
    res.json({ success: true, data: coach });
  } catch (err) {
    next(err);
  }
}

export async function updateCoach(req, res, next) {
  try {
    const coach = await adminService.updateCoachByAdmin(req.params.id, req.body);
    res.json({ success: true, data: coach });
  } catch (err) {
    next(err);
  }
}
