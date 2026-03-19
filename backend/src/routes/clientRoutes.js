import { Router } from 'express';
import * as clientController from '../controllers/clientController.js';
import { authMiddleware, attachUser, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/', authMiddleware, attachUser, requireRole('coach'), clientController.listByCoach);
router.post('/', authMiddleware, attachUser, requireRole('coach'), clientController.create);
router.get('/:id', authMiddleware, attachUser, clientController.getById);
router.put('/:id', authMiddleware, attachUser, requireRole('coach'), clientController.update);
router.delete('/:id', authMiddleware, attachUser, requireRole('coach'), clientController.remove);

export default router;
