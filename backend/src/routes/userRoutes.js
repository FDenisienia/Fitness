import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authMiddleware, attachUser, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/', authMiddleware, attachUser, requireRole('admin'), userController.list);

export default router;
