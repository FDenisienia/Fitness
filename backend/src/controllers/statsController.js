import { prisma } from '../utils/prisma.js';

export async function adminStats(req, res, next) {
  try {
    const adminId = req.user.id;

    const coachRows = await prisma.coach.findMany({
      where: {
        deletedAt: null,
        user: {
          OR: [{ createdById: adminId }, { createdById: null }],
        },
      },
      select: { id: true },
    });
    const coachIds = coachRows.map((c) => c.id);

    const [coachesCount, clientsCount, completedWorkouts, pendingAgg, convCount] = await Promise.all([
      prisma.coach.count({
        where: {
          deletedAt: null,
          user: {
            OR: [{ createdById: adminId }, { createdById: null }],
          },
        },
      }),
      coachIds.length
        ? prisma.client.count({ where: { coachId: { in: coachIds } } })
        : 0,
      coachIds.length
        ? prisma.plannedWorkout.count({
            where: {
              completed: true,
              client: { coachId: { in: coachIds } },
            },
          })
        : 0,
      prisma.adminCoachConversation.aggregate({
        where: { adminId },
        _sum: { adminUnreadCount: true },
      }),
      prisma.adminCoachConversation.count({ where: { adminId } }),
    ]);

    res.json({
      success: true,
      data: {
        coachesCount,
        clientsCount,
        completedWorkouts,
        pendingMessages: pendingAgg._sum.adminUnreadCount ?? 0,
        conversationsCount: convCount,
      },
    });
  } catch (err) {
    next(err);
  }
}
