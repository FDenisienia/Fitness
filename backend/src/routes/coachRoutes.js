import { Router } from 'express';
import * as coachController from '../controllers/coachController.js';
import { authMiddleware, attachUser, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/', authMiddleware, attachUser, requireRole('admin'), coachController.list);
router.post('/', authMiddleware, attachUser, requireRole('admin'), coachController.create);
router.post('/:id/deactivate', authMiddleware, attachUser, requireRole('admin'), coachController.deactivate);
router.post('/:id/activate', authMiddleware, attachUser, requireRole('admin'), coachController.activate);
router.delete('/:id', authMiddleware, attachUser, requireRole('admin'), coachController.softDelete);
router.get('/:id', authMiddleware, attachUser, requireRole('admin'), coachController.getById);
router.put('/:id', authMiddleware, attachUser, requireRole('admin'), coachController.update);

export default router;
