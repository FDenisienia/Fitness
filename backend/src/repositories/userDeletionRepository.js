/**
 * Acceso a datos para eliminación en cascada de usuarios (coach / alumno).
 */

export async function findUserWithRelations(tx, userId) {
  return tx.user.findUnique({
    where: { id: userId },
    include: {
      coach: {
        include: {
          clients: { select: { userId: true, id: true } },
        },
      },
      client: { select: { id: true, coachId: true } },
    },
  });
}

/**
 * Borra datos del perfil Client y la fila Client antes del User.
 * Evita fallos si en MySQL faltan ON DELETE CASCADE y deja la BD consistente.
 */
export async function deleteClienteProfileAndDeps(tx, userId) {
  const client = await tx.client.findUnique({ where: { userId } });
  if (!client) return;

  await tx.chatMessage.deleteMany({
    where: { conversation: { clientId: client.id } },
  });
  await tx.conversation.deleteMany({ where: { clientId: client.id } });
  await tx.plannedWorkout.deleteMany({ where: { clientId: client.id } });
  await tx.clientRoutine.deleteMany({ where: { clientId: client.id } });
  await tx.weightLog.deleteMany({ where: { clientId: client.id } });
  await tx.progressLog.deleteMany({ where: { clientId: client.id } });
  await tx.client.delete({ where: { id: client.id } });
}

export async function deleteUserById(tx, userId) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return;

  if (user.role === 'cliente') {
    await deleteClienteProfileAndDeps(tx, userId);
    await tx.user.delete({ where: { id: userId } });
    return;
  }

  return tx.user.delete({ where: { id: userId } });
}
