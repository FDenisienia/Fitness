import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../utils/prisma.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token no proporcionado');
    }
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, config.jwtSecret);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token inválido o expirado'));
    }
    next(err);
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.userRole)) {
      return next(new ForbiddenError('No tienes permiso para esta acción'));
    }
    next();
  };
}

export async function attachUser(req, res, next) {
  try {
    if (!req.userId) return next();
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        role: true,
        status: true,
        coach: { select: { id: true, subscriptionPlan: true } },
        client: { select: { id: true, coachId: true } },
      },
    });
    if (!user || user.status !== 'active') {
      return next(new UnauthorizedError('Usuario no válido'));
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
