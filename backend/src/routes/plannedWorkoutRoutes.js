import { Router } from 'express';
import * as plannedWorkoutController from '../controllers/plannedWorkoutController.js';
import { authMiddleware, attachUser, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/client/:clientId', authMiddleware, attachUser, plannedWorkoutController.listByClient);
router.post('/client/:clientId', authMiddleware, attachUser, requireRole('coach'), plannedWorkoutController.create);
router.put('/:id', authMiddleware, attachUser, plannedWorkoutController.update);

export default router;
