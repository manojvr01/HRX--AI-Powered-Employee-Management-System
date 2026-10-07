export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: ApiErrorDetail[];
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    errorCode = 'INTERNAL_SERVER_ERROR',
    details?: ApiErrorDetail[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: ApiErrorDetail[]) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', details?: ApiErrorDetail[]) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden: Insufficient permissions', details?: ApiErrorDetail[]) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: ApiErrorDetail[]) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: ApiErrorDetail[]) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again later.', details?: ApiErrorDetail[]) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details);
  }
}

export class LockedOutError extends AppError {
  constructor(message = 'Account is temporarily locked out due to multiple failed login attempts. Please try again later.') {
    super(message, 423, 'ACCOUNT_LOCKED');
  }
}
