import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const requestId = (req as unknown as { id?: string }).id;

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details,
      },
    });
    return;
  }

  // 2. Custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // 3. Mongoose CastError (e.g. invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: `Invalid format for field '${err.path}'`,
        details: [{ field: err.path, message: `Cast to ${err.kind} failed for value '${err.value}'` }],
      },
    });
    return;
  }

  // 4. Mongoose Duplicate Key Error
  if ((err as unknown as { code?: number }).code === 11000) {
    const keyVal = (err as unknown as { keyValue?: Record<string, unknown> }).keyValue;
    const field = keyVal ? Object.keys(keyVal)[0] : 'field';
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_RESOURCE',
        message: `A record with this ${field} already exists.`,
      },
    });
    return;
  }

  // 5. Unhandled / Server Error
  logger.error(
    {
      requestId,
      err: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
    },
    'Unhandled server error'
  );

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        env.NODE_ENV === 'production'
          ? 'An unexpected error occurred. Please try again later.'
          : err.message || 'Internal server error',
    },
  });
}
