import { api } from './client.js';

export const adminApi = {
  updateMe: (body) => api.put('/admin/me', body),
};
