export class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    details = undefined,
  ) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace?.(
      this,
      this.constructor,
    );
  }
}

export class ValidationError extends AppError {
  constructor(
    message,
    code = 'VALIDATION_ERROR',
    details = undefined,
  ) {
    super(message, 400, code, details);
  }
}

export class NotFoundError extends AppError {
  constructor(
    message,
    code = 'NOT_FOUND',
    details = undefined,
  ) {
    super(message, 404, code, details);
  }
}

export class ConflictError extends AppError {
  constructor(
    message,
    code = 'CONFLICT',
    details = undefined,
  ) {
    super(message, 400, code, details);
  }
}

export class BusinessRuleError extends AppError {
  constructor(
    message,
    code = 'BUSINESS_RULE_ERROR',
    details = undefined,
  ) {
    super(message, 400, code, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message = 'Autenticación requerida',
    code = 'UNAUTHORIZED',
    details = undefined,
  ) {
    super(message, 401, code, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = 'Acceso denegado',
    code = 'FORBIDDEN',
    details = undefined,
  ) {
    super(message, 403, code, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(
    message,
    code = 'EXTERNAL_SERVICE_ERROR',
    details = undefined,
  ) {
    super(message, 502, code, details);
  }
}
