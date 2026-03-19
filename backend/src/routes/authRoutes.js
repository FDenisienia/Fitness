import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { loginValidator, registerValidator, validate } from '../validators/authValidator.js';
import { authMiddleware, attachUser } from '../middlewares/auth.js';

const router = Router();

router.post('/login', loginValidator, validate, authController.login);
router.post('/register', registerValidator, validate, authController.register);
router.get('/me', authMiddleware, attachUser, authController.me);

export default router;
