/**
 * Persistencia en BD: al bloquear un coach, todos sus clientes quedan bloqueados.
 * Usado desde deactivateCoach, softDeleteCoach y cualquier flujo futuro que ponga inactive al coach.
 */
export async function blockCoachUserAndAllClients(tx, coachId) {
  const coach = await tx.coach.findUnique({
    where: { id: coachId },
    select: {
      userId: true,
      clients: { select: { userId: true } },
    },
  });
  if (!coach) return;

  await tx.user.update({
    where: { id: coach.userId },
    data: { status: 'inactive' },
  });
  const clientUserIds = coach.clients.map((c) => c.userId);
  if (clientUserIds.length) {
    await tx.user.updateMany({
      where: { id: { in: clientUserIds } },
      data: { status: 'inactive' },
    });
  }
}

export async function activateCoachUserAndAllClients(tx, coachId) {
  const coach = await tx.coach.findUnique({
    where: { id: coachId },
    select: {
      userId: true,
      clients: { select: { userId: true } },
    },
  });
  if (!coach) return;

  await tx.user.update({
    where: { id: coach.userId },
    data: { status: 'active' },
  });
  const clientUserIds = coach.clients.map((c) => c.userId);
  if (clientUserIds.length) {
    await tx.user.updateMany({
      where: { id: { in: clientUserIds } },
      data: { status: 'active' },
    });
  }
}
