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

const logisticUniqueConstraints = {
  despachos_pedido_activo_unique: [
    'El pedido ya posee un despacho activo',
    'PEDIDO_YA_ASIGNADO',
  ],
  jornadas_reparto_camion_activo_unique: [
    'El camión ya posee una jornada activa',
    'CAMION_NO_DISPONIBLE',
  ],
  jornadas_reparto_chofer_activo_unique: [
    'El chofer ya posee una jornada activa',
    'CHOFER_NO_DISPONIBLE',
  ],
  jornadas_reparto_camion_en_ruta_unique: [
    'El camión ya posee una jornada en ruta',
    'CAMION_NO_DISPONIBLE',
  ],
  jornadas_reparto_chofer_en_ruta_unique: [
    'El chofer ya posee una jornada en ruta',
    'CHOFER_NO_DISPONIBLE',
  ],
  despachos_jornada_orden_unique: [
    'La jornada ya posee un despacho con ese orden de entrega',
    'ORDEN_ENTREGA_DUPLICADO',
  ],
  despachos_jornada_pedido_unique: [
    'El pedido ya está asignado a esta jornada',
    'PEDIDO_YA_ASIGNADO',
  ],
};

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
    const constraint =
      err.parent?.constraint ??
      err.original?.constraint ??
      err.constraint;

    const mapped =
      logisticUniqueConstraints[constraint];

    if (mapped) {
      return new ConflictError(
        mapped[0],
        mapped[1],
      );
    }

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
      code: error.code,
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
