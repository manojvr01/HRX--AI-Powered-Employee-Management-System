import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';
import { Request } from 'express';
import mongoose from 'mongoose';

export interface AuditLogOptions {
  userId?: string | mongoose.Types.ObjectId;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  req?: Request;
}

export async function logAudit(options: AuditLogOptions): Promise<void> {
  try {
    const ipAddress = options.req?.ip || options.req?.socket?.remoteAddress;
    const userAgent = options.req?.get('user-agent');

    await AuditLog.create({
      userId: options.userId ? new mongoose.Types.ObjectId(options.userId.toString()) : undefined,
      action: options.action,
      entity: options.entity,
      entityId: options.entityId,
      details: options.details,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    logger.error({ err }, 'Failed to record audit log entry');
  }
}
