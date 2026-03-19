import { prisma } from '../utils/prisma.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

export async function listWeightLogs(clientId, coachId = null) {
  if (coachId) {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client || client.coachId !== coachId) throw new ForbiddenError('Acceso denegado');
  }
  const logs = await prisma.weightLog.findMany({
    where: { clientId },
    orderBy: { loggedAt: 'desc' },
  });
  const toDateStr = (d) => (d ? d.toISOString().slice(0, 10) : null);
  return logs.map((l) => ({
    id: l.id,
    clientId: l.clientId,
    peso: l.weight,
    weight: l.weight,
    fecha: toDateStr(l.loggedAt),
    loggedAt: l.loggedAt,
    observaciones: l.notes,
    notes: l.notes,
    createdAt: l.createdAt,
  }));
}

export async function createWeightLog(clientId, data, coachId = null) {
  if (coachId) {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client || client.coachId !== coachId) throw new ForbiddenError('Acceso denegado');
  }
  const weight = parseFloat(data.weight || data.peso);
  if (isNaN(weight) || weight <= 0) throw new Error('Peso inválido');
  const log = await prisma.weightLog.create({
    data: {
      clientId,
      weight,
      notes: data.notes || data.observaciones || null,
      loggedAt: data.loggedAt || data.fecha ? new Date(data.loggedAt || data.fecha) : new Date(),
    },
  });
  const toDateStr = (d) => (d ? d.toISOString().slice(0, 10) : null);
  return { id: log.id, clientId: log.clientId, peso: log.weight, weight: log.weight, fecha: toDateStr(log.loggedAt), observaciones: log.notes };
}

export async function updateWeightLog(id, clientId, data, coachId = null) {
  const log = await prisma.weightLog.findUnique({ where: { id } });
  if (!log) throw new NotFoundError('Registro de peso');
  if (log.clientId !== clientId) throw new ForbiddenError('Acceso denegado');
  if (coachId) {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client || client.coachId !== coachId) throw new ForbiddenError('Acceso denegado');
  }
  const updateData = {};
  if (data.weight !== undefined || data.peso !== undefined) {
    const w = parseFloat(data.weight ?? data.peso);
    if (!isNaN(w) && w > 0) updateData.weight = w;
  }
  if (data.loggedAt !== undefined || data.fecha !== undefined) {
    updateData.loggedAt = new Date(data.loggedAt || data.fecha);
  }
  if (data.notes !== undefined || data.observaciones !== undefined) {
    updateData.notes = data.notes ?? data.observaciones ?? null;
  }
  if (Object.keys(updateData).length === 0) {
    const existing = await prisma.weightLog.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Registro de peso');
    const toDateStr = (d) => (d ? d.toISOString().slice(0, 10) : null);
    return { id: existing.id, clientId: existing.clientId, peso: existing.weight, weight: existing.weight, fecha: toDateStr(existing.loggedAt), observaciones: existing.notes };
  }
  const updated = await prisma.weightLog.update({
    where: { id },
    data: updateData,
  });
  const toDateStr = (d) => (d ? d.toISOString().slice(0, 10) : null);
  return { id: updated.id, clientId: updated.clientId, peso: updated.weight, weight: updated.weight, fecha: toDateStr(updated.loggedAt), observaciones: updated.notes };
}

export async function deleteWeightLog(id, clientId, coachId = null) {
  const log = await prisma.weightLog.findUnique({ where: { id } });
  if (!log) throw new NotFoundError('Registro de peso');
  if (log.clientId !== clientId) throw new ForbiddenError('Acceso denegado');
  if (coachId) {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client || client.coachId !== coachId) throw new ForbiddenError('Acceso denegado');
  }
  await prisma.weightLog.delete({ where: { id } });
  return { success: true };
}
