import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authMiddleware, attachUser, requireRole } from '../middlewares/auth.js';
import { patchPasswordValidator, validate } from '../validators/authValidator.js';

const router = Router();

/** Admin: coaches (no alumnos). Coach: solo sus clientes. */
router.patch(
  '/:id/password',
  authMiddleware,
  attachUser,
  requireRole('admin', 'coach'),
  patchPasswordValidator,
  validate,
  userController.patchPassword
);

/** Admin: coaches que creó. Coach: sus clientes. Cliente: sin acceso (403). */
router.get('/', authMiddleware, attachUser, requireRole('admin', 'coach'), userController.list);

/** Admin: borrado en cascada por user id (coach o alumno). */
router.delete(
  '/:id',
  authMiddleware,
  attachUser,
  requireRole('admin'),
  userController.destroy
);

export default router;
