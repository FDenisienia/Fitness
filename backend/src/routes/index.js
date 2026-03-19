import { Router } from 'express';
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

const router = Router();

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

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'FitCoach API OK' });
});

export default router;
