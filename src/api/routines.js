import { api } from './client.js';

export const routinesApi = {
  list: () => api.get('/routines'),
  getById: (id) => api.get(`/routines/${id}`),
  create: (data) => api.post('/routines', data),
  update: (id, data) => api.put(`/routines/${id}`, data),
  delete: (id) => api.delete(`/routines/${id}`),
};
