import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ValidationError } from '../utils/errors.js';

export function validateObjectId(paramName = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];
    if (value && (typeof value !== 'string' || !mongoose.Types.ObjectId.isValid(value))) {
      next(
        new ValidationError(`Invalid ID format for parameter '${paramName}'`, [
          {
            field: paramName,
            message: `Value '${value}' is not a valid MongoDB ObjectId`,
            code: 'INVALID_OBJECT_ID',
          },
        ])
      );
      return;
    }
    next();
  };
}
