import { api } from './client.js';

export const weightLogsApi = {
  listByClient: (clientId) => api.get(`/weight-logs/client/${clientId}`),
  create: (clientId, data) => api.post(`/weight-logs/client/${clientId}`, data),
  update: (id, clientId, data) => api.put(`/weight-logs/${id}/client/${clientId}`, data),
  delete: (id, clientId) => api.delete(`/weight-logs/${id}/client/${clientId}`),
};
