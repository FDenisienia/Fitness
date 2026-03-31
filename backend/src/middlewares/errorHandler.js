import { AppError } from '../utils/errors.js';

export function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV === 'development';
  const statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';

  // Solo ocultar mensaje en 5xx “genéricos” no operativos (p. ej. Error de librería sin status).
  if (!isDev && statusCode === 500 && !(err instanceof AppError)) {
    message = 'Error interno del servidor';
  }

  if (!isDev && statusCode >= 500) {
    console.error('[API]', req.method, req.originalUrl, statusCode, err?.message || err);
  }
  if (isDev) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(isDev && { stack: err.stack }),
  });
}
