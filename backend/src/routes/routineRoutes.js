import { Router } from 'express';
import * as routineController from '../controllers/routineController.js';
import { authMiddleware, attachUser, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/', authMiddleware, attachUser, routineController.list);
router.get('/:id', authMiddleware, attachUser, routineController.getById);
router.post('/', authMiddleware, attachUser, requireRole('coach', 'admin'), routineController.create);
router.put('/:id', authMiddleware, attachUser, requireRole('coach', 'admin'), routineController.update);
router.delete('/:id', authMiddleware, attachUser, requireRole('coach', 'admin'), routineController.remove);

export default router;
