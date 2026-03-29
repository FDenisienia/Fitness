import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as contactController from '../controllers/contactController.js';

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados envíos desde esta red. Probá en unos minutos.' },
});

router.post('/', contactLimiter, contactController.submitContact);

export default router;
