import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User, IUserDocument } from '../models/User.js';
import { UnauthorizedError, ForbiddenError, LockedOutError } from '../utils/errors.js';
import { Permission, hasPermission, UserRole, UserStatus } from '@hrx/shared';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  employeeId?: string;
  mustChangePassword: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('No authentication token provided'));
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    const user = await User.findById(decoded.sub);
    if (!user) {
      next(new UnauthorizedError('User account not found'));
      return;
    }

    if (user.status !== UserStatus.ACTIVE) {
      next(new ForbiddenError(`Account is ${user.status.toLowerCase()}`));
      return;
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      next(new LockedOutError());
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      status: user.status,
      employeeId: user.employeeId?.toString(),
      mustChangePassword: user.mustChangePassword,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Access token has expired'));
      return;
    }
    next(new UnauthorizedError('Invalid access token'));
  }
}

export function authorize(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      next(
        new ForbiddenError(
          `Action not permitted. Requires permission: '${permission}'`
        )
      );
      return;
    }

    next();
  };
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          `Access restricted to roles: [${roles.join(', ')}]`
        )
      );
      return;
    }

    next();
  };
}
