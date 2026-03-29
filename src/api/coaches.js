import { api } from './client.js';

export const coachesApi = {
  list: () => api.get('/coaches'),
  getById: (id) => api.get(`/coaches/${id}`),
  create: (data) => api.post('/coaches', data),
  update: (id, data) => api.put(`/coaches/${id}`, data),
  deactivate: (id) => api.post(`/coaches/${id}/deactivate`, {}),
  activate: (id) => api.post(`/coaches/${id}/activate`, {}),
  remove: (id) => api.delete(`/coaches/${id}`),
};
