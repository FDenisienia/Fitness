import { prisma } from '../utils/prisma.js';

export async function adminStats(req, res, next) {
  try {
    const [coachesCount, clientsCount, completedWorkouts] = await Promise.all([
      prisma.coach.count(),
      prisma.client.count(),
      prisma.plannedWorkout.count({ where: { completed: true } }),
    ]);
    res.json({
      success: true,
      data: {
        coachesCount,
        clientsCount,
        completedWorkouts,
        pendingMessages: 0, // Mensajería en desarrollo
        conversationsCount: 0,
      },
    });
  } catch (err) {
    next(err);
  }
}
