import { api } from './client.js';

export const routinesApi = {
  list: () => api.get('/routines'),
  getById: (id, query = {}) => {
    const q = new URLSearchParams();
    if (query.forClient) q.set('forClient', query.forClient);
    const s = q.toString();
    return api.get(`/routines/${id}${s ? `?${s}` : ''}`);
  },
  create: (data) => api.post('/routines', data),
  update: (id, data) => api.put(`/routines/${id}`, data),
  delete: (id) => api.delete(`/routines/${id}`),
};
