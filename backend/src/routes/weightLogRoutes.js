import { Router } from 'express';
import * as weightLogController from '../controllers/weightLogController.js';
import { authMiddleware, attachUser, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/client/:clientId', authMiddleware, attachUser, weightLogController.listByClient);
router.post('/client/:clientId', authMiddleware, attachUser, weightLogController.create);
router.put('/:id/client/:clientId', authMiddleware, attachUser, weightLogController.update);
router.delete('/:id/client/:clientId', authMiddleware, attachUser, weightLogController.remove);

export default router;
