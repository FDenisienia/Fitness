import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/authController.js';
import { loginValidator, registerValidator, validate } from '../validators/authValidator.js';
import { authMiddleware, attachUser } from '../middlewares/auth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, error: 'Demasiados intentos de inicio de sesión. Probá más tarde.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados registros desde esta red. Probá más tarde.' },
});

router.post('/login', loginLimiter, loginValidator, validate, authController.login);
router.post('/register', registerLimiter, registerValidator, validate, authController.register);
router.get('/me', authMiddleware, attachUser, authController.me);

export default router;
