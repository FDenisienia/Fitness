import { api } from './client.js';

export const exercisesApi = {
  list: (params) => api.get('/exercises' + (params ? '?' + new URLSearchParams(params).toString() : '')),
  getById: (id) => api.get(`/exercises/${id}`),
  create: (data) => api.post('/exercises', data),
  update: (id, data) => api.put(`/exercises/${id}`, data),
  delete: (id) => api.delete(`/exercises/${id}`),
};
