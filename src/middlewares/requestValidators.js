import {
  ValidationError,
} from '../utils/errors.js';

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CEDULA_REGEX = /^\d{10}$/;

const TELEFONO_REGEX =
  /^(\+593\d{9}|0\d{9})$/;

const hasText = (value) =>
  typeof value === 'string' &&
  value.trim().length > 0;

const isPresent = (value) =>
  value !== undefined &&
  value !== null &&
  value !== '';

const isPositiveNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) && number > 0;
};

const isNonNegativeNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0;
};

const isPositiveInteger = (value) => {
  const number = Number(value);

  return Number.isInteger(number) && number > 0;
};

const validate = (rules) => (req, res, next) => {
  try {
    for (const rule of rules) {
      rule(req);
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

const requireText = (
  value,
  message,
  code,
) => {
  if (!hasText(value)) {
    throw new ValidationError(message, code);
  }
};

const optionalText = (
  value,
  message,
  code,
) => {
  if (
    value !== undefined &&
    !hasText(value)
  ) {
    throw new ValidationError(message, code);
  }
};

const requireEmail = (value) => {
  if (!EMAIL_REGEX.test(String(value ?? ''))) {
    throw new ValidationError(
      'Correo electrónico inválido',
      'CORREO_INVALIDO',
    );
  }
};

const optionalEmail = (value) => {
  if (
    value !== undefined &&
    !EMAIL_REGEX.test(String(value ?? ''))
  ) {
    throw new ValidationError(
      'Correo electrónico inválido',
      'CORREO_INVALIDO',
    );
  }
};

const validateCoordinates = (body) => {
  const hasLatitud = isPresent(body.latitud);
  const hasLongitud = isPresent(body.longitud);

  if (hasLatitud !== hasLongitud) {
    throw new ValidationError(
      'La ubicación debe registrar latitud y longitud juntas',
      'COORDENADAS_INCOMPLETAS',
    );
  }

  if (
    hasLatitud &&
    (
      !Number.isFinite(Number(body.latitud)) ||
      !Number.isFinite(Number(body.longitud))
    )
  ) {
    throw new ValidationError(
      'Las coordenadas deben ser numéricas',
      'COORDENADAS_INVALIDAS',
    );
  }
};

export const validarIdParam = validate([
  (req) => {
    if (!isPositiveInteger(req.params.id)) {
      throw new ValidationError(
        'ID inválido',
        'ID_INVALIDO',
      );
    }
  },
]);

export const validarLogin = validate([
  (req) =>
    requireText(
      req.body.correo,
      'El correo es obligatorio',
      'CORREO_OBLIGATORIO',
    ),
  (req) => {
    if (!req.body.password) {
      throw new ValidationError(
        'La contraseña es obligatoria',
        'PASSWORD_OBLIGATORIO',
      );
    }
  },
]);

export const validarCrearCategoria = validate([
  (req) =>
    requireText(
      req.body.nombre,
      'El nombre es obligatorio',
      'NOMBRE_OBLIGATORIO',
    ),
]);

export const validarActualizarCategoria = validate([
  (req) =>
    optionalText(
      req.body.nombre,
      'El nombre no puede estar vacío',
      'NOMBRE_VACIO',
    ),
]);

export const validarCrearUbicacion = validate([
  (req) =>
    requireText(
      req.body.nombre,
      'El nombre es obligatorio',
      'NOMBRE_OBLIGATORIO',
    ),
  (req) => validateCoordinates(req.body),
]);

export const validarActualizarUbicacion = validate([
  (req) =>
    optionalText(
      req.body.nombre,
      'El nombre no puede estar vacío',
      'NOMBRE_VACIO',
    ),
  (req) => validateCoordinates(req.body),
]);

export const validarCrearCliente = validate([
  (req) =>
    requireText(
      req.body.nombre,
      'El nombre es obligatorio',
      'NOMBRE_OBLIGATORIO',
    ),
  (req) => {
    if (!CEDULA_REGEX.test(String(req.body.identificacion ?? ''))) {
      throw new ValidationError(
        'La identificación debe contener exactamente 10 dígitos',
        'IDENTIFICACION_INVALIDA',
      );
    }
  },
  (req) => {
    if (!TELEFONO_REGEX.test(String(req.body.telefono ?? ''))) {
      throw new ValidationError(
        'Teléfono inválido',
        'TELEFONO_INVALIDO',
      );
    }
  },
  (req) => requireEmail(req.body.correo),
  (req) =>
    requireText(
      req.body.direccion,
      'La dirección es obligatoria',
      'DIRECCION_OBLIGATORIA',
    ),
]);

export const validarActualizarCliente = validate([
  (req) =>
    optionalText(
      req.body.nombre,
      'El nombre no puede estar vacío',
      'NOMBRE_VACIO',
    ),
  (req) => {
    if (
      req.body.identificacion !== undefined &&
      !CEDULA_REGEX.test(String(req.body.identificacion ?? ''))
    ) {
      throw new ValidationError(
        'La identificación debe contener exactamente 10 dígitos',
        'IDENTIFICACION_INVALIDA',
      );
    }
  },
  (req) => {
    if (
      req.body.telefono !== undefined &&
      !TELEFONO_REGEX.test(String(req.body.telefono ?? ''))
    ) {
      throw new ValidationError(
        'Teléfono inválido',
        'TELEFONO_INVALIDO',
      );
    }
  },
  (req) => optionalEmail(req.body.correo),
]);

export const validarCrearProducto = validate([
  (req) =>
    requireText(
      req.body.codigo,
      'El código es obligatorio',
      'CODIGO_OBLIGATORIO',
    ),
  (req) =>
    requireText(
      req.body.nombre,
      'El nombre es obligatorio',
      'NOMBRE_OBLIGATORIO',
    ),
  (req) => {
    if (!isPositiveNumber(req.body.precio_compra)) {
      throw new ValidationError(
        'Precio de compra inválido',
        'PRECIO_COMPRA_INVALIDO',
      );
    }
  },
  (req) => {
    if (!isPositiveNumber(req.body.precio_venta)) {
      throw new ValidationError(
        'Precio de venta inválido',
        'PRECIO_VENTA_INVALIDO',
      );
    }
  },
  (req) => {
    if (
      req.body.stock_actual !== undefined &&
      !isNonNegativeNumber(req.body.stock_actual)
    ) {
      throw new ValidationError(
        'El stock actual no puede ser negativo',
        'STOCK_ACTUAL_INVALIDO',
      );
    }
  },
  (req) => {
    if (
      req.body.stock_minimo !== undefined &&
      !isNonNegativeNumber(req.body.stock_minimo)
    ) {
      throw new ValidationError(
        'El stock mínimo no puede ser negativo',
        'STOCK_MINIMO_INVALIDO',
      );
    }
  },
]);

export const validarActualizarProducto = validate([
  (req) =>
    optionalText(
      req.body.codigo,
      'El código es obligatorio',
      'CODIGO_OBLIGATORIO',
    ),
  (req) =>
    optionalText(
      req.body.nombre,
      'El nombre es obligatorio',
      'NOMBRE_OBLIGATORIO',
    ),
  (req) => {
    if (
      req.body.precio_compra !== undefined &&
      !isPositiveNumber(req.body.precio_compra)
    ) {
      throw new ValidationError(
        'Precio de compra inválido',
        'PRECIO_COMPRA_INVALIDO',
      );
    }
  },
  (req) => {
    if (
      req.body.precio_venta !== undefined &&
      !isPositiveNumber(req.body.precio_venta)
    ) {
      throw new ValidationError(
        'Precio de venta inválido',
        'PRECIO_VENTA_INVALIDO',
      );
    }
  },
  (req) => {
    if (
      req.body.stock_actual !== undefined &&
      !isNonNegativeNumber(req.body.stock_actual)
    ) {
      throw new ValidationError(
        'El stock actual no puede ser negativo',
        'STOCK_ACTUAL_INVALIDO',
      );
    }
  },
  (req) => {
    if (
      req.body.stock_minimo !== undefined &&
      !isNonNegativeNumber(req.body.stock_minimo)
    ) {
      throw new ValidationError(
        'El stock mínimo no puede ser negativo',
        'STOCK_MINIMO_INVALIDO',
      );
    }
  },
]);

export const validarCrearRuta = validate([
  (req) => {
    if (!req.body.origen_id || !req.body.destino_id) {
      throw new ValidationError(
        'Origen y destino son obligatorios',
        'ORIGEN_DESTINO_OBLIGATORIOS',
      );
    }
  },
  (req) => {
    if (!isPositiveNumber(req.body.distancia_km)) {
      throw new ValidationError(
        'La distancia debe ser mayor que cero',
        'DISTANCIA_INVALIDA',
      );
    }
  },
]);

export const validarActualizarRuta = validate([
  (req) => {
    if (
      req.body.distancia_km !== undefined &&
      !isPositiveNumber(req.body.distancia_km)
    ) {
      throw new ValidationError(
        'La distancia debe ser mayor que cero',
        'DISTANCIA_INVALIDA',
      );
    }
  },
]);

export const validarCrearUsuario = validate([
  (req) =>
    requireText(
      req.body.nombre,
      'El nombre es obligatorio',
      'NOMBRE_OBLIGATORIO',
    ),
  (req) =>
    requireText(
      req.body.apellido,
      'El apellido es obligatorio',
      'APELLIDO_OBLIGATORIO',
    ),
  (req) => requireEmail(req.body.correo),
  (req) => {
    if (
      !req.body.password ||
      req.body.password.length < 6
    ) {
      throw new ValidationError(
        'La contraseña debe tener al menos 6 caracteres',
        'PASSWORD_INVALIDO',
      );
    }
  },
  (req) => {
    if (!isPresent(req.body.rol)) {
      throw new ValidationError(
        'Rol inválido',
        'ROL_INVALIDO',
      );
    }
  },
]);

export const validarActualizarUsuario = validate([
  (req) =>
    optionalText(
      req.body.nombre,
      'El nombre no puede estar vacío',
      'NOMBRE_VACIO',
    ),
  (req) =>
    optionalText(
      req.body.apellido,
      'El apellido no puede estar vacío',
      'APELLIDO_VACIO',
    ),
  (req) => optionalEmail(req.body.correo),
  (req) => {
    if (
      req.body.password !== undefined &&
      req.body.password.length < 6
    ) {
      throw new ValidationError(
        'La contraseña debe tener al menos 6 caracteres',
        'PASSWORD_INVALIDO',
      );
    }
  },
]);

export const validarCrearPedido = validate([
  (req) => {
    if (!isPositiveInteger(req.body.cliente_id)) {
      throw new ValidationError(
        'Cliente no válido',
        'CLIENTE_INVALIDO',
      );
    }
  },
  (req) => {
    if (
      req.body.usuario_id !== undefined &&
      !isPositiveInteger(req.body.usuario_id)
    ) {
      throw new ValidationError(
        'Usuario no válido',
        'USUARIO_INVALIDO',
      );
    }
  },
]);

export const validarCrearDetallePedido = validate([
  (req) => {
    if (!req.body.pedido_id) {
      throw new ValidationError(
        'pedido_id es obligatorio',
        'PEDIDO_ID_OBLIGATORIO',
      );
    }
  },
  (req) => {
    if (!req.body.producto_id) {
      throw new ValidationError(
        'producto_id es obligatorio',
        'PRODUCTO_ID_OBLIGATORIO',
      );
    }
  },
  (req) => {
    if (!isPositiveNumber(req.body.cantidad)) {
      throw new ValidationError(
        'Cantidad inválida',
        'CANTIDAD_INVALIDA',
      );
    }
  },
]);

export const validarActualizarDetallePedido = validate([
  (req) => {
    if (
      req.body.cantidad !== undefined &&
      !isPositiveNumber(req.body.cantidad)
    ) {
      throw new ValidationError(
        'La cantidad debe ser mayor a cero',
        'CANTIDAD_INVALIDA',
      );
    }
  },
]);

export const validarActualizarPreparacionDetalle = validate([
  (req) => {
    const cantidad = Number(
      req.body.cantidad_preparada,
    );

    if (
      !Number.isInteger(cantidad) ||
      cantidad < 0
    ) {
      throw new ValidationError(
        'Cantidad preparada inválida',
        'CANTIDAD_PREPARADA_INVALIDA',
      );
    }
  },
]);

export const validarActualizarCargaDespacho = validate([
  (req) => {
    if (typeof req.body.cargado !== 'boolean') {
      throw new ValidationError(
        'El estado de carga debe ser booleano',
        'CARGADO_INVALIDO',
      );
    }
  },
]);

export const validarAsignarChofer = validate([
  (req) => {
    if (!isPositiveInteger(req.body.chofer_id)) {
      throw new ValidationError(
        'Chofer inválido',
        'CHOFER_INVALIDO',
      );
    }
  },
]);

export const validarCrearChofer = validate([
  (req) => {
    if (!isPositiveInteger(req.body.usuario_id)) {
      throw new ValidationError(
        'Usuario inválido',
        'USUARIO_INVALIDO',
      );
    }
  },
  (req) =>
    requireText(
      req.body.numero_licencia,
      'El número de licencia es obligatorio',
      'LICENCIA_OBLIGATORIA',
    ),
  (req) =>
    requireText(
      req.body.categoria_licencia,
      'La categoría de licencia es obligatoria',
      'CATEGORIA_LICENCIA_OBLIGATORIA',
    ),
  (req) => {
    if (!isPresent(req.body.fecha_vencimiento_licencia)) {
      throw new ValidationError(
        'La fecha de vencimiento de licencia es obligatoria',
        'FECHA_LICENCIA_OBLIGATORIA',
      );
    }
  },
]);

export const validarActualizarChofer = validate([
  (req) =>
    optionalText(
      req.body.numero_licencia,
      'El número de licencia no puede estar vacío',
      'LICENCIA_VACIA',
    ),
  (req) =>
    optionalText(
      req.body.categoria_licencia,
      'La categoría de licencia no puede estar vacía',
      'CATEGORIA_LICENCIA_VACIA',
    ),
]);

export const validarCrearCamion = validate([
  (req) =>
    requireText(
      req.body.codigo,
      'El código del camión es obligatorio',
      'CODIGO_CAMION_OBLIGATORIO',
    ),
  (req) =>
    requireText(
      req.body.placa,
      'La placa del camión es obligatoria',
      'PLACA_CAMION_OBLIGATORIA',
    ),
  (req) => {
    if (!isPositiveInteger(req.body.capacidad)) {
      throw new ValidationError(
        'La capacidad del camión debe ser mayor a cero',
        'CAPACIDAD_CAMION_INVALIDA',
      );
    }
  },
]);

export const validarActualizarCamion = validate([
  (req) =>
    optionalText(
      req.body.codigo,
      'El código del camión no puede estar vacío',
      'CODIGO_CAMION_VACIO',
    ),
  (req) =>
    optionalText(
      req.body.placa,
      'La placa del camión no puede estar vacía',
      'PLACA_CAMION_VACIA',
    ),
  (req) => {
    if (
      req.body.capacidad !== undefined &&
      !isPositiveInteger(req.body.capacidad)
    ) {
      throw new ValidationError(
        'La capacidad del camión debe ser mayor a cero',
        'CAPACIDAD_CAMION_INVALIDA',
      );
    }
  },
]);
