import { api } from './client.js';

function expandQuery(expand) {
  if (!expand) return '';
  const e = Array.isArray(expand) ? expand.join(',') : String(expand);
  const q = new URLSearchParams();
  q.set('expand', e);
  return `?${q.toString()}`;
}

export const clientsApi = {
  list: (options = {}) => api.get(`/clients${expandQuery(options.expand)}`),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};
