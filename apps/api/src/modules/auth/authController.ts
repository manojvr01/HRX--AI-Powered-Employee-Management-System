import { Request, Response, NextFunction } from 'express';
import {
  loginUser,
  refreshUserSession,
  logoutUser,
  changeUserPassword,
  buildAuthUser,
} from '../../services/authService.js';
import { User } from '../../models/User.js';
import { UnauthorizedError } from '../../utils/errors.js';
import { env } from '../../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password, req);

    if (result.tokens.refreshToken) {
      res.cookie('refreshToken', result.tokens.refreshToken, COOKIE_OPTIONS);
    }

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      throw new UnauthorizedError('Refresh token required');
    }

    const tokens = await refreshUserSession(token, req);

    if (tokens.refreshToken) {
      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);
    }

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: tokens,
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const userId = req.user?.id;

    await logoutUser(token, userId, req);
    res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, maxAge: 0 });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const userDoc = await User.findById(req.user.id);
    if (!userDoc) {
      throw new UnauthorizedError('User not found');
    }

    const authUser = await buildAuthUser(userDoc);

    res.status(200).json({
      success: true,
      data: authUser,
    });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const { currentPassword, newPassword } = req.body;
    await changeUserPassword(req.user.id, currentPassword, newPassword, req);

    res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, maxAge: 0 });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    });
  } catch (err) {
    next(err);
  }
}
