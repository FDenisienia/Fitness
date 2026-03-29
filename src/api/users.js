import { api } from './client.js';

export const usersApi = {
  list: (params) => api.get('/users' + (params ? '?' + new URLSearchParams(params).toString() : '')),
  /** Admin: coaches (no alumnos). Coach: solo clientes propios. Body: { password } */
  patchPassword: (userId, body) => api.patch(`/users/${userId}/password`, body),
  /** Admin: borrado en cascada (coach o alumno). */
  remove: (userId) => api.delete(`/users/${userId}`),
};
