import {
  AppError,
  BusinessRuleError,
  ConflictError,
  ExternalServiceError,
  ValidationError,
} from '../utils/errors.js';

const isProduction =
  process.env.NODE_ENV === 'production';

const isSequelizeError = (err, name) =>
  err?.name === name ||
  err?.constructor?.name === name;

const normalizeSequelizeError = (err) => {
  if (
    isSequelizeError(
      err,
      'SequelizeValidationError',
    )
  ) {
    return new ValidationError(
      err.errors?.[0]?.message ??
        'Datos inválidos',
      'SEQUELIZE_VALIDATION_ERROR',
    );
  }

  if (
    isSequelizeError(
      err,
      'SequelizeUniqueConstraintError',
    )
  ) {
    return new ConflictError(
      err.errors?.[0]?.message ??
        'El registro ya existe',
      'SEQUELIZE_UNIQUE_CONSTRAINT',
    );
  }

  if (
    isSequelizeError(
      err,
      'SequelizeForeignKeyConstraintError',
    )
  ) {
    return new BusinessRuleError(
      'El registro mantiene relaciones inválidas o dependientes',
      'SEQUELIZE_FOREIGN_KEY_CONSTRAINT',
    );
  }

  return null;
};

const normalizeExternalError = (err) => {
  if (
    err?.code === 'ECONNABORTED' ||
    err?.code === 'ECONNREFUSED' ||
    err?.code === 'ENOTFOUND' ||
    err?.code === 'ECONNRESET'
  ) {
    return new ExternalServiceError(
      'No fue posible completar la operación con el servicio externo',
      'EXTERNAL_SERVICE_UNAVAILABLE',
    );
  }

  return null;
};

const errorHandler = (err, req, res, next) => {
  const error =
    err instanceof AppError
      ? err
      : normalizeSequelizeError(err) ??
        normalizeExternalError(err);

  if (error?.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  if (!isProduction) {
    console.error(err);
  }

  return res.status(500).json({
    success: false,
    message: isProduction
      ? 'Error interno del servidor'
      : err?.message || 'Error interno del servidor',
  });
};

export default errorHandler;
