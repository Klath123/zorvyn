import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { RoleName } from '@prisma/client';
import { AuthRequest, AuthPayload } from '../types';
import { AppError } from '../utils/response';

/**
 * Verifies JWT token from Authorization header.
 * Attaches decoded payload to req.user.
 */
export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Please provide a valid token.', 401));
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return next(new AppError('Server configuration error.', 500));
  }

  try {
    const decoded = jwt.verify(token, secret) as AuthPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid token. Authentication failed.', 401));
  }
};

/**
 * Role-based access control middleware factory.
 * Usage: requireRole(['ADMIN', 'ANALYST'])
 *
 * This mimics Zorvyn's access-control model where finance roles
 * (viewer, analyst, admin) have progressively increasing permissions.
 */
export const requireRole = (allowedRoles: RoleName[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    const userRoles = req.user.roles;
    const hasPermission = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasPermission) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${userRoles.join(', ')}.`,
          403
        )
      );
    }

    next();
  };
};

// Convenience middleware for common role checks
export const requireAdmin = requireRole(['ADMIN']);
export const requireAnalystOrAdmin = requireRole(['ANALYST', 'ADMIN']);
export const requireAnyRole = requireRole(['VIEWER', 'ANALYST', 'ADMIN']);
