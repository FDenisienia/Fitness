import { api } from './client.js';

export const statsApi = {
  adminStats: () => api.get('/stats/admin'),
};
