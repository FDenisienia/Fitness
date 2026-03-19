import * as userService from '../services/userService.js';

export async function list(req, res, next) {
  try {
    const users = await userService.listUsers(req.query);
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}
