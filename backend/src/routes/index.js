import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import coachRoutes from './coachRoutes.js';
import clientRoutes from './clientRoutes.js';
import exerciseRoutes from './exerciseRoutes.js';
import routineRoutes from './routineRoutes.js';
import clientRoutineRoutes from './clientRoutineRoutes.js';
import weightLogRoutes from './weightLogRoutes.js';
import plannedWorkoutRoutes from './plannedWorkoutRoutes.js';
import statsRoutes from './statsRoutes.js';
import chatRoutes from './chatRoutes.js';
import contactRoutes from './contactRoutes.js';

const router = Router();

router.use('/public/contact', contactRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/coaches', coachRoutes);
router.use('/clients', clientRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/routines', routineRoutes);
router.use('/client-routines', clientRoutineRoutes);
router.use('/weight-logs', weightLogRoutes);
router.use('/planned-workouts', plannedWorkoutRoutes);
router.use('/stats', statsRoutes);
router.use('/chat', chatRoutes);

router.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, message: 'Athlento API OK', database: 'ok' });
  } catch (err) {
    res.status(503).json({
      success: false,
      message: 'Athlento API arrancó pero la base de datos no responde',
      database: 'error',
      ...(process.env.NODE_ENV === 'development' && { detail: err.message }),
    });
  }
});

export default router;
