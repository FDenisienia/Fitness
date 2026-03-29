import { api } from './client.js';

export const usersApi = {
  list: (params) => api.get('/users' + (params ? '?' + new URLSearchParams(params).toString() : '')),
  /** Admin: coaches (no alumnos). Coach: solo clientes propios. Body: { password } */
  patchPassword: (userId, body) => api.patch(`/users/${userId}/password`, body),
};
