import { Router } from 'express';
import * as statsController from '../controllers/statsController.js';
import { authMiddleware, attachUser, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/admin', authMiddleware, attachUser, requireRole('admin'), statsController.adminStats);

export default router;
