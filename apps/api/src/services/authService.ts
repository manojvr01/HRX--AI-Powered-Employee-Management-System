import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User, IUserDocument } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { RefreshSession } from '../models/RefreshSession.js';
import { logAudit } from './auditService.js';
import {
  UnauthorizedError,
  LockedOutError,
  ForbiddenError,
  ValidationError,
} from '../utils/errors.js';
import {
  ROLE_PERMISSIONS,
  UserStatus,
  AuthUser,
  AuthTokens,
  LoginResponseData,
} from '@hrx/shared';
import { Request } from 'express';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateTokens(
  user: IUserDocument,
  family: string
): { accessToken: string; refreshToken: string; tokenHash: string; expiresAt: Date } {
  const payload = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  const refreshJti = crypto.randomUUID();
  const refreshToken = jwt.sign(
    { sub: user._id.toString(), family, jti: refreshJti },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  const tokenHash = hashToken(refreshToken);

  // 7 days expiration date for refresh token session
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return { accessToken, refreshToken, tokenHash, expiresAt };
}

export async function buildAuthUser(user: IUserDocument): Promise<AuthUser> {
  let employee = null;
  if (user.employeeId) {
    const empDoc = await Employee.findById(user.employeeId);
    if (empDoc) {
      employee = {
        id: empDoc._id.toString(),
        employeeCode: empDoc.employeeCode,
        firstName: empDoc.firstName,
        lastName: empDoc.lastName,
        position: empDoc.position,
        departmentId: empDoc.departmentId?.toString(),
        avatarUrl: empDoc.avatarUrl,
      };
    }
  }

  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    permissions: ROLE_PERMISSIONS[user.role] || [],
    employee,
  };
}

export async function loginUser(
  email: string,
  plainPassword: string,
  req?: Request
): Promise<LoginResponseData> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  if (!user) {
    await logAudit({
      action: 'AUTH_LOGIN_FAILED',
      entity: 'User',
      details: { email: normalizedEmail, reason: 'User not found' },
      req,
    });
    throw new UnauthorizedError('Invalid email or password');
  }

  // Check account lockout
  if (user.lockoutUntil && user.lockoutUntil > new Date()) {
    const remainingMinutes = Math.ceil(
      (user.lockoutUntil.getTime() - Date.now()) / (60 * 1000)
    );
    throw new LockedOutError(
      `Account is locked due to too many failed attempts. Try again in ${remainingMinutes} minute(s).`
    );
  }

  // Check user status
  if (user.status !== UserStatus.ACTIVE) {
    throw new ForbiddenError(`Account is ${user.status.toLowerCase()}`);
  }

  // Verify password
  const isMatch = await bcrypt.compare(plainPassword, user.passwordHash);
  if (!isMatch) {
    user.failedLoginAttempts += 1;
    let locked = false;

    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      locked = true;
    }

    await user.save();

    await logAudit({
      userId: user._id,
      action: locked ? 'AUTH_ACCOUNT_LOCKED' : 'AUTH_LOGIN_FAILED',
      entity: 'User',
      details: {
        email: normalizedEmail,
        failedAttempts: user.failedLoginAttempts,
        locked,
      },
      req,
    });

    if (locked) {
      throw new LockedOutError();
    }

    throw new UnauthorizedError('Invalid email or password');
  }

  // Successful login -> Reset lockout and failed attempts
  user.failedLoginAttempts = 0;
  user.lockoutUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  // Create new session family
  const family = crypto.randomUUID();
  const { accessToken, refreshToken, tokenHash, expiresAt } = generateTokens(user, family);

  await RefreshSession.create({
    userId: user._id,
    tokenHash,
    family,
    isRevoked: false,
    expiresAt,
    userAgent: req?.get('user-agent'),
    ipAddress: req?.ip,
  });

  await logAudit({
    userId: user._id,
    action: 'AUTH_LOGIN_SUCCESS',
    entity: 'User',
    details: { email: user.email, role: user.role },
    req,
  });

  const authUser = await buildAuthUser(user);

  return {
    user: authUser,
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 mins
    },
  };
}

export async function refreshUserSession(
  refreshTokenString: string,
  req?: Request
): Promise<AuthTokens> {
  let decoded: { sub: string; family: string; jti: string };

  try {
    decoded = jwt.verify(refreshTokenString, env.JWT_REFRESH_SECRET) as {
      sub: string;
      family: string;
      jti: string;
    };
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const tokenHash = hashToken(refreshTokenString);
  const session = await RefreshSession.findOne({ tokenHash });

  // REUSE DETECTION:
  // If the session record does not exist OR is already revoked,
  // someone is attempting to reuse an invalidated refresh token!
  if (!session || session.isRevoked) {
    // Revoke all sessions in this token family immediately
    if (decoded.family) {
      await RefreshSession.updateMany(
        { family: decoded.family },
        { isRevoked: true }
      );
    }

    await logAudit({
      userId: decoded.sub,
      action: 'AUTH_REFRESH_REUSE_DETECTED',
      entity: 'RefreshSession',
      details: {
        family: decoded.family,
        reason: 'Revoked refresh token reuse detected. Revoking entire session family.',
      },
      req,
    });

    throw new UnauthorizedError(
      'Session breach detected: Refresh token has already been used or revoked. All active sessions in family have been revoked.'
    );
  }

  // Valid session: rotate token
  // 1. Mark current session as revoked
  session.isRevoked = true;
  await session.save();

  // 2. Fetch user
  const user = await User.findById(decoded.sub);
  if (!user || user.status !== UserStatus.ACTIVE) {
    throw new UnauthorizedError('User account not found or inactive');
  }

  // 3. Issue new tokens in the SAME family
  const { accessToken, refreshToken, tokenHash: newTokenHash, expiresAt } =
    generateTokens(user, session.family);

  await RefreshSession.create({
    userId: user._id,
    tokenHash: newTokenHash,
    family: session.family,
    isRevoked: false,
    expiresAt,
    userAgent: req?.get('user-agent'),
    ipAddress: req?.ip,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: 900,
  };
}

export async function logoutUser(
  refreshTokenString?: string,
  userId?: string,
  req?: Request
): Promise<void> {
  if (refreshTokenString) {
    const tokenHash = hashToken(refreshTokenString);
    await RefreshSession.updateOne({ tokenHash }, { isRevoked: true });
  }

  if (userId) {
    await logAudit({
      userId,
      action: 'AUTH_LOGOUT',
      entity: 'User',
      req,
    });
  }
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  req?: Request
): Promise<void> {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new ValidationError('Current password is incorrect');
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = newHash;
  user.mustChangePassword = false;
  await user.save();

  // Invalidate all existing refresh sessions for security
  await RefreshSession.updateMany(
    { userId: new mongoose.Types.ObjectId(userId) },
    { isRevoked: true }
  );

  await logAudit({
    userId: user._id,
    action: 'AUTH_PASSWORD_CHANGED',
    entity: 'User',
    req,
  });
}
