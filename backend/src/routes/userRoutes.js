import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authMiddleware, attachUser, requireRole } from '../middlewares/auth.js';
import { patchPasswordValidator, validate } from '../validators/authValidator.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

/** Admin: coaches (no alumnos). Coach: solo sus clientes. */
router.patch(
  '/:id/password',
  authMiddleware,
  attachUser,
  requireRole(ROLES.ADMIN, ROLES.COACH),
  patchPasswordValidator,
  validate,
  userController.patchPassword
);

/** Admin: todos los coaches. Coach: sus clientes. Cliente: sin acceso (403). */
router.get('/', authMiddleware, attachUser, requireRole(ROLES.ADMIN, ROLES.COACH), userController.list);

/** Admin: borrado en cascada por user id (coach o alumno). */
router.delete(
  '/:id',
  authMiddleware,
  attachUser,
  requireRole(ROLES.ADMIN),
  userController.destroy
);

export default router;
