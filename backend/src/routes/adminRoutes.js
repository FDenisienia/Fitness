import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { authMiddleware, attachUser, requireRole } from '../middlewares/auth.js';
import { ROLES } from '../constants/roles.js';
import {
  updateAdminMeValidator,
  updateAdminCoachValidator,
  validateAdmin,
} from '../validators/adminValidator.js';

const router = Router();

router.put(
  '/me',
  authMiddleware,
  attachUser,
  requireRole(ROLES.ADMIN),
  updateAdminMeValidator,
  validateAdmin,
  adminController.updateMe
);

router.get('/coaches', authMiddleware, attachUser, requireRole(ROLES.ADMIN), adminController.listCoaches);

router.get(
  '/coaches/:id',
  authMiddleware,
  attachUser,
  requireRole(ROLES.ADMIN),
  adminController.getCoachById
);

router.put(
  '/coaches/:id',
  authMiddleware,
  attachUser,
  requireRole(ROLES.ADMIN),
  updateAdminCoachValidator,
  validateAdmin,
  adminController.updateCoach
);

export default router;
