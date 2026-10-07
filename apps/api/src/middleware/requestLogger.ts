import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

export interface RequestWithId extends Request {
  id?: string;
}

export function requestLogger(req: RequestWithId, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
}
