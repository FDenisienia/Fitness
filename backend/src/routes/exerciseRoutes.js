import { Router } from 'express';
import * as exerciseController from '../controllers/exerciseController.js';
import { authMiddleware, attachUser, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/', authMiddleware, attachUser, exerciseController.list);
router.get('/:id', authMiddleware, attachUser, exerciseController.getById);
router.post('/', authMiddleware, attachUser, requireRole('admin', 'coach'), exerciseController.create);
router.put('/:id', authMiddleware, attachUser, requireRole('admin', 'coach'), exerciseController.update);
router.delete('/:id', authMiddleware, attachUser, requireRole('admin', 'coach'), exerciseController.remove);

export default router;
