import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors.js';

function hasDisallowedOperators(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    // Detect MongoDB query operator injection ($gt, $where, $regex, injected[$gt], etc.) or dotted path injection
    if (key.includes('$') || key.includes('.')) {
      return true;
    }
    if (typeof value === 'object' && value !== null) {
      if (hasDisallowedOperators(value)) {
        return true;
      }
    }
  }

  return false;
}

export function preventQueryInjection(req: Request, res: Response, next: NextFunction): void {
  if (
    hasDisallowedOperators(req.query) ||
    hasDisallowedOperators(req.body) ||
    hasDisallowedOperators(req.params)
  ) {
    next(new ValidationError('Query contains disallowed operators or characters ($ or .)', [
      { message: 'Potential NoSQL injection attempt blocked', code: 'DISALLOWED_OPERATOR' },
    ]));
    return;
  }

  next();
}
