import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  BusinessRuleError,
  ConflictError,
  ExternalServiceError,
  NotFoundError,
  ValidationError,
} from '../../src/utils/errors.js';

const root = process.cwd();

const controllerFiles = [
  'auth.controller.js',
  'camion.controller.js',
  'categoria.controller.js',
  'cliente.controller.js',
  'despacho.controller.js',
  'detallePedido.controller.js',
  'jornadaReparto.controller.js',
  'pedido.controller.js',
  'producto.controller.js',
  'ruta.controller.js',
  'ubicacion.controller.js',
  'usuario.controller.js',
];

const makeResponse = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

test('errorHandler traduce errores tipados y Sequelize manteniendo forma pública', async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';

  const { default: errorHandler } = await import(
    `../../src/middlewares/errorHandler.js?dev=${Date.now()}`
  );

  const casos = [
    [
      new ValidationError('Entrada inválida', 'TEST_VALIDATION'),
      400,
      'Entrada inválida',
    ],
    [
      new NotFoundError('Registro no encontrado', 'TEST_NOT_FOUND'),
      404,
      'Registro no encontrado',
    ],
    [
      new ConflictError('Registro duplicado', 'TEST_CONFLICT'),
      400,
      'Registro duplicado',
    ],
    [
      new BusinessRuleError('Regla incumplida', 'TEST_BUSINESS'),
      400,
      'Regla incumplida',
    ],
    [
      new ExternalServiceError('Servicio externo falló', 'TEST_EXTERNAL'),
      502,
      'Servicio externo falló',
    ],
    [
      {
        name: 'SequelizeValidationError',
        errors: [{ message: 'Campo requerido' }],
      },
      400,
      'Campo requerido',
    ],
    [
      {
        name: 'SequelizeUniqueConstraintError',
        errors: [{ message: 'Valor duplicado' }],
      },
      400,
      'Valor duplicado',
    ],
    [
      {
        name: 'SequelizeForeignKeyConstraintError',
      },
      400,
      'El registro mantiene relaciones inválidas o dependientes',
    ],
  ];

  for (const [error, status, message] of casos) {
    const res = makeResponse();

    errorHandler(error, {}, res, () => {});

    assert.equal(res.statusCode, status);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, message);
    assert.equal(typeof res.body.code, 'string');
  }

  process.env.NODE_ENV = originalEnv;
});

test('errorHandler no expone detalles internos inesperados en producción', async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  const { default: errorHandler } = await import(
    `../../src/middlewares/errorHandler.js?prod=${Date.now()}`
  );

  const res = makeResponse();

  errorHandler(
    new Error('detalle interno sensible'),
    {},
    res,
    () => {},
  );

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    success: false,
    message: 'Error interno del servidor',
  });

  process.env.NODE_ENV = originalEnv;
});

test('controladores activos delegan errores y no contienen responsabilidades de negocio', () => {
  for (const file of controllerFiles) {
    const source = fs.readFileSync(
      path.join(root, 'src', 'controllers', file),
      'utf8',
    );

    assert.match(source, /asyncHandler/, file);
    assert.doesNotMatch(source, /errorResponse/, file);
    assert.doesNotMatch(source, /from '\.\.\/models/, file);
    assert.doesNotMatch(source, /bcrypt/, file);
    assert.doesNotMatch(source, /sequelize\.transaction/, file);
    assert.doesNotMatch(source, /python/i, file);
    assert.doesNotMatch(source, /n8n/i, file);
    assert.doesNotMatch(source, /try\s*\{/, file);
    assert.doesNotMatch(source, /catch\s*\(/, file);

    const exportedHandlers = source
      .split(/export const /)
      .slice(1);

    for (const handler of exportedHandlers) {
      const serviceCalls =
        handler.match(
          /await\s+\w+Service\.\w+\(/g,
        ) ?? [];

      assert.ok(
        serviceCalls.length <= 1,
        `${file} contiene un handler con más de una llamada principal a servicio`,
      );
    }
  }
});
