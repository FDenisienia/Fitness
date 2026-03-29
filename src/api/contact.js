import { api } from './client.js';

export const contactApi = {
  /** Formulario público de la landing (sin JWT). */
  submit: (body) => api.post('/public/contact', body),
};
