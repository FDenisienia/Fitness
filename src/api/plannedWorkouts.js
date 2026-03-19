import { api } from './client.js';

export const plannedWorkoutsApi = {
  listByClient: (clientId, params) =>
    api.get(`/planned-workouts/client/${clientId}` + (params ? '?' + new URLSearchParams(params).toString() : '')),
  create: (clientId, data) => api.post(`/planned-workouts/client/${clientId}`, data),
  update: (id, data) => api.put(`/planned-workouts/${id}`, data),
};
