import '../loadEnv.js';

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const extraOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl,
  corsOrigins: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173', ...extraOrigins].filter(Boolean),
};
