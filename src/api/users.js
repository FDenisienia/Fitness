import { api } from './client.js';

export const usersApi = {
  list: (params) => api.get('/users' + (params ? '?' + new URLSearchParams(params).toString() : '')),
};
