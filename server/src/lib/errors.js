export class AppError extends Error {
  constructor(message, statusCode = 400, code = 'BAD_REQUEST', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access', details = null) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden action', details = null) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class QuotaExceededError extends AppError {
  constructor(message = 'Daily AI quota exceeded', details = null) {
    super(message, 429, 'AI_QUOTA_EXCEEDED', details);
  }
}

export class AIServiceError extends AppError {
  constructor(code = 'AI_ERROR', message = 'AI service error occurred', details = null) {
    super(message, 502, code, details);
  }
}
