import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  modelInstance,
  stubMethods,
} from './helpers/testEnv.js';

const root = process.cwd();

const read = (...segments) =>
  fs.readFileSync(
    path.join(root, ...segments),
    'utf8',
  );

test('dashboard exige usuario autenticado y soporta todos los roles activos', async () => {
  const service = await import(
    '../../src/services/dashboard.service.js'
  );

  await assert.rejects(
    () => service.obtenerResumen(),
    (error) => {
      assert.equal(
        error.code,
        'DASHBOARD_AUTH_REQUERIDA',
      );
      assert.equal(error.statusCode, 401);
      return true;
    },
  );

  await assert.rejects(
    () => service.obtenerResumen({
      id: 99,
      rol: 'DESCONOCIDO',
    }),
    (error) => {
      assert.equal(
        error.code,
        'DASHBOARD_ROL_NO_SOPORTADO',
      );
      assert.equal(error.statusCode, 403);
      return true;
    },
  );
});

test('dashboard de Ventas limita métricas y notificaciones a pedidos propios', async (t) => {
  const service = await import(
    '../../src/services/dashboard.service.js'
  );
  const { default: db } = await import(
    '../../src/models/index.js'
  );

  const user = {
    id: 55,
    rol: 'VENTAS',
  };
  const expectedCounts = {
    PENDIENTE: 3,
    PREPARANDO: 2,
    LISTO_PARA_DESPACHO: 1,
    ENTREGADO: 7,
    REPROGRAMADO: 1,
  };

  stubMethods(t, db.Pedido, {
    count: async (options) => {
      assert.equal(
        options.where.creado_por_usuario_id,
        user.id,
      );

      return expectedCounts[options.where.estado] ?? 0;
    },
    findAll: async (options) => {
      assert.equal(
        options.where.creado_por_usuario_id,
        user.id,
      );
      assert.ok(
        options.where.estado,
      );

      return [
        modelInstance({
          id: 10,
          estado: 'PREPARANDO',
          updated_at: new Date(),
        }),
      ];
    },
  });
  stubMethods(t, db.Cliente, {
    count: async () => 48,
  });

  const result = await service.obtenerResumen(user);

  assert.equal(result.rol, 'VENTAS');
  assert.equal(
    result.contexto.alcance_pedidos,
    'PROPIOS',
  );
  assert.equal(result.alertas.length, 1);
  assert.equal(
    result.alertas[0].acceso_id,
    'PEDIDOS',
  );
  assert.ok(
    result.accesos.some(
      (item) => item.id === 'PEDIDOS',
    ),
  );
  assert.ok(
    result.accesos.every(
      (item) =>
        !['JORNADAS', 'DESPACHOS'].includes(
          item.id,
        ),
    ),
  );
});

test('notificaciones de Bodega consultan solo preparación y carga', async (t) => {
  const service = await import(
    '../../src/services/dashboard.service.js'
  );
  const { default: db } = await import(
    '../../src/models/index.js'
  );

  stubMethods(t, db.Pedido, {
    findAll: async (options) => {
      assert.equal(options.where.estado, 'PREPARANDO');
      assert.equal(options.limit, 6);

      return [
        modelInstance({
          id: 20,
          enviado_preparacion_en: new Date(),
        }),
      ];
    },
  });
  stubMethods(t, db.JornadaReparto, {
    findAll: async (options) => {
      assert.equal(options.where.estado, 'PLANIFICADA');
      assert.equal(options.limit, 6);

      return [
        modelInstance({
          id: 30,
          carga_confirmada_en: null,
          updated_at: new Date(),
        }),
      ];
    },
  });

  const result =
    await service.obtenerNotificaciones(
      {
        id: 8,
        rol: 'BODEGA',
      },
      {
        limit: 6,
      },
    );

  assert.equal(result.rol, 'BODEGA');
  assert.equal(result.total, 2);
  assert.deepEqual(
    new Set(
      result.items.map((item) => item.acceso_id),
    ),
    new Set(['PREPARACION', 'CARGA']),
  );
});

test('límite de notificaciones queda acotado entre 1 y 20', async (t) => {
  const service = await import(
    '../../src/services/dashboard.service.js'
  );
  const { default: db } = await import(
    '../../src/models/index.js'
  );

  stubMethods(t, db.Pedido, {
    findAll: async (options) => {
      assert.equal(options.limit, 20);
      return [];
    },
  });
  stubMethods(t, db.JornadaReparto, {
    findAll: async (options) => {
      assert.equal(options.limit, 20);
      return [];
    },
  });

  const result =
    await service.obtenerNotificaciones(
      {
        id: 9,
        rol: 'BODEGA',
      },
      {
        limit: 500,
      },
    );

  assert.equal(result.total, 0);
});

test('rutas dashboard son autenticadas, role-aware y están montadas en server', () => {
  const routes = read(
    'src',
    'routes',
    'dashboard.routes.js',
  );
  const server = read('server.js');
  const controller = read(
    'src',
    'controllers',
    'dashboard.controller.js',
  );

  assert.match(
    routes,
    /router\.use\(\s*authMiddleware\.requireAuth,\s*\);/,
  );
  assert.match(routes, /['"]\/resumen['"]/);
  assert.match(
    routes,
    /['"]\/notificaciones['"]/,
  );
  assert.doesNotMatch(
    routes,
    /requirePermission/,
  );
  assert.match(
    server,
    /app\.use\(\s*['"]\/api\/dashboard['"]\s*,\s*dashboardRoutes\s*,?\s*\);/,
  );
  assert.match(
    controller,
    /dashboardService\.obtenerResumen\(\s*req\.user/,
  );
  assert.match(
    controller,
    /dashboardService\.obtenerNotificaciones\(\s*req\.user/,
  );
});
