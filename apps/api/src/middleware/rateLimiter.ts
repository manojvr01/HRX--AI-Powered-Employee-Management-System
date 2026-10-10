import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../utils/errors.js';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: RateLimitOptions) {
  const ipMap = new Map<string, RequestRecord>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const record = ipMap.get(ip);

    if (!record || now > record.resetTime) {
      ipMap.set(ip, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      return next();
    }

    if (record.count >= options.max) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      return next(
        new RateLimitError(
          options.message || 'Rate limit exceeded. Please try again later.'
        )
      );
    }

    record.count++;
    next();
  };
}

export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'AI request limit reached. Please wait a minute before making further AI queries.',
});
