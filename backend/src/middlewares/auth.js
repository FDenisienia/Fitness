import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../utils/prisma.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { isUserBlocked } from '../utils/userStatus.js';

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
    req.jwtTokenVersion = typeof decoded.tv === 'number' ? decoded.tv : 0;
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
        username: true,
        email: true,
        name: true,
        lastName: true,
        role: true,
        status: true,
        createdById: true,
        assignedCoachId: true,
        tokenVersion: true,
        coach: { select: { id: true, subscriptionPlan: true, deletedAt: true } },
        client: { select: { id: true, coachId: true, coach: { select: { user: { select: { status: true } } } } } },
      },
    });
    if (!user) {
      return next(new UnauthorizedError('Usuario no válido'));
    }
    const expectedTv = user.tokenVersion ?? 0;
    const fromJwt = typeof req.jwtTokenVersion === 'number' ? req.jwtTokenVersion : 0;
    if (fromJwt !== expectedTv) {
      return next(new UnauthorizedError('Sesión invalidada. Vuelve a iniciar sesión.'));
    }
    if (isUserBlocked(user.status)) {
      return next(new UnauthorizedError('Usuario bloqueado'));
    }
    if (user.role === 'coach' && user.coach?.deletedAt) {
      return next(new UnauthorizedError('Usuario bloqueado'));
    }
    if (user.role === 'cliente' && user.client?.coach?.user) {
      if (isUserBlocked(user.client.coach.user.status)) {
        return next(new UnauthorizedError('Usuario bloqueado'));
      }
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
