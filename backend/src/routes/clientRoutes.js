import { Router } from 'express';
import * as clientController from '../controllers/clientController.js';
import { authMiddleware, attachUser, requireRole } from '../middlewares/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.get('/', authMiddleware, attachUser, requireRole(ROLES.COACH), clientController.listByCoach);
router.post('/', authMiddleware, attachUser, requireRole(ROLES.COACH), clientController.create);
router.get('/:id', authMiddleware, attachUser, clientController.getById);
router.put('/:id', authMiddleware, attachUser, requireRole(ROLES.COACH), clientController.update);
router.delete('/:id', authMiddleware, attachUser, requireRole(ROLES.COACH), clientController.remove);

export default router;
