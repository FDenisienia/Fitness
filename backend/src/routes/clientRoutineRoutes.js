import { Router } from 'express';
import * as clientRoutineController from '../controllers/clientRoutineController.js';
import { authMiddleware, attachUser, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/client/:clientId', authMiddleware, attachUser, clientRoutineController.listByClient);
router.post('/assign', authMiddleware, attachUser, requireRole('coach'), clientRoutineController.assign);
router.delete('/client/:clientId/routine/:routineId', authMiddleware, attachUser, requireRole('coach'), clientRoutineController.unassign);

export default router;
