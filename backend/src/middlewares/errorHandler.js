import { AppError } from '../utils/errors.js';

export function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV === 'development';
  const statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';

  if (!isDev && statusCode >= 500 && !(err instanceof AppError)) {
    message = 'Error interno del servidor';
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
