import { Router } from 'express';
import * as coachController from '../controllers/coachController.js';
import { authMiddleware, attachUser, requireRole } from '../middlewares/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.get('/', authMiddleware, attachUser, requireRole(ROLES.ADMIN), coachController.list);
router.post('/', authMiddleware, attachUser, requireRole(ROLES.ADMIN), coachController.create);
router.post('/:id/deactivate', authMiddleware, attachUser, requireRole(ROLES.ADMIN), coachController.deactivate);
router.post('/:id/activate', authMiddleware, attachUser, requireRole(ROLES.ADMIN), coachController.activate);
router.post('/:id/soft-delete', authMiddleware, attachUser, requireRole(ROLES.ADMIN), coachController.softDelete);
router.delete('/:id', authMiddleware, attachUser, requireRole(ROLES.ADMIN), coachController.hardDelete);
router.get('/:id', authMiddleware, attachUser, requireRole(ROLES.ADMIN), coachController.getById);
router.put('/:id', authMiddleware, attachUser, requireRole(ROLES.ADMIN), coachController.update);

export default router;
