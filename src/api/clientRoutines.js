import { api } from './client.js';

export const clientRoutinesApi = {
  listByClient: (clientId) => api.get(`/client-routines/client/${clientId}`),
  assign: (clientId, routineId, assignmentDate) =>
    api.post('/client-routines/assign', { clientId, routineId, assignmentDate }),
  unassign: (clientId, routineId) => api.delete(`/client-routines/client/${clientId}/routine/${routineId}`),
};
