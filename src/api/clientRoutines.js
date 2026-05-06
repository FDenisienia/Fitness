import { api } from './client.js';

export const clientRoutinesApi = {
  listByClient: (clientId) => api.get(`/client-routines/client/${clientId}`),
  assign: (clientId, routineId, assignmentDate, exerciseSetWeights) =>
    api.post('/client-routines/assign', {
      clientId,
      routineId,
      assignmentDate,
      ...(exerciseSetWeights != null ? { exerciseSetWeights } : {}),
    }),
  unassign: (clientId, routineId) => api.delete(`/client-routines/client/${clientId}/routine/${routineId}`),
  getAssignment: (assignmentId) => api.get(`/client-routines/assignment/${assignmentId}`),
  patchSetWeights: (assignmentId, body) =>
    api.patch(`/client-routines/assignment/${assignmentId}/set-weights`, body),
};
