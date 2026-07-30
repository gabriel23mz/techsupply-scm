import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Op } from 'sequelize';

import {
  modelInstance,
  stubMethods,
} from './helpers/testEnv.js';

const root = process.cwd();

const read = (...segments) =>
  fs.readFileSync(
    path.join(
      root,
      ...segments,
    ),
    'utf8',
  );

test('flujo heredado de despacho individual queda fuera de backend y frontend', () => {
  const logisticaService = read(
    'src',
    'services',
    'logistica.service.js',
  );
  const despachoRoutes = read(
    'src',
    'routes',
    'despacho.routes.js',
  );
  const despachoController = read(
    'src',
    'controllers',
    'despacho.controller.js',
  );
  const frontendLogistica = read(
    'frontend',
    'src',
    'modules',
    'logistica',
    'services',
    'logistica.service.js',
  );

  for (const source of [
    logisticaService,
    despachoController,
    frontendLogistica,
  ]) {
    assert.doesNotMatch(
      source,
      /crearDespacho|iniciarDespacho|cancelarDespacho|sincronizarEstadoConDespacho/,
    );
  }

  assert.doesNotMatch(
    despachoRoutes,
    /router\.post\(\s*['"]\/['"]/,
  );
  assert.doesNotMatch(
    despachoRoutes,
    /['"]\/:id\/iniciar['"]/,
  );
  assert.doesNotMatch(
    despachoRoutes,
    /['"]\/:id\/cancelar['"]/,
  );
  assert.match(
    despachoRoutes,
    /['"]\/:id\/entregar['"]/,
  );
  assert.match(
    despachoRoutes,
    /['"]\/:id\/no-entregado['"]/,
  );
});

test('logistica.service conserva solo responsabilidades técnicas de planificación', () => {
  const source = read(
    'src',
    'services',
    'logistica.service.js',
  );

  assert.match(
    source,
    /pythonService\.generarJornadaMetaheuristica/,
  );
  assert.match(
    source,
    /n8nService\s*\.\s*jornadaCreada/,
  );
  assert.doesNotMatch(
    source,
    /from '\.\/pedido\.service\.js'|from '\.\/despacho\.service\.js'|from '\.\/ruta\.service\.js'/,
  );
  assert.doesNotMatch(
    source,
    /Pedido\.update|Despacho\.create|estado:\s*['"]DESPACHADO['"]/,
  );
});

test('migración de integridad logística crea índices parciales reversibles y chequea duplicados', () => {
  const source = read(
    'database',
    'migrations',
    '20260724000500-add-logistic-integrity-constraints.js',
  );

  const expectedIndexes = [
    'despachos_pedido_activo_unique',
    'jornadas_reparto_camion_activo_unique',
    'jornadas_reparto_chofer_activo_unique',
    'jornadas_reparto_camion_en_ruta_unique',
    'jornadas_reparto_chofer_en_ruta_unique',
    'despachos_jornada_orden_unique',
    'despachos_jornada_pedido_unique',
  ];

  for (const indexName of expectedIndexes) {
    assert.match(
      source,
      new RegExp(`CREATE UNIQUE INDEX "${indexName}"`),
      indexName,
    );
    assert.match(
      source,
      new RegExp(`DROP INDEX IF EXISTS "${indexName}"`),
      indexName,
    );
  }

  assert.match(
    source,
    /WHERE "estado" IN \('PENDIENTE', 'EN_TRANSITO'\)/,
  );
  assert.match(
    source,
    /WHERE "estado" IN \('PLANIFICADA', 'EN_RUTA'\)/,
  );
  assert.match(
    source,
    /ON "jornadas_reparto" \("camion_id", "fecha"\)/,
  );
  assert.match(
    source,
    /ON "jornadas_reparto" \("chofer_id", "fecha"\)/,
  );
  assert.match(
    source,
    /GROUP BY "camion_id", "fecha"/,
  );
  assert.match(
    source,
    /GROUP BY "chofer_id", "fecha"/,
  );
  assert.match(
    source,
    /WHERE "estado" = 'EN_RUTA'/,
  );
  assert.match(
    source,
    /Consulta de diagnóstico/,
  );
  assert.doesNotMatch(
    source,
    /DELETE FROM|UPDATE "despachos"|UPDATE "jornadas_reparto"/,
  );
});

test('migración temporal agrega solo estimaciones faltantes y no inventa fechas históricas', () => {
  const source = read(
    'database',
    'migrations',
    '20260724000600-add-logistic-temporal-estimates.js',
  );

  assert.match(
    source,
    /addColumn\(\s*'jornadas_reparto',\s*'inicio_estimado_en'/,
  );
  assert.match(
    source,
    /addColumn\(\s*'jornadas_reparto',\s*'retorno_estimado_en'/,
  );
  assert.match(
    source,
    /changeColumn\(\s*'pedidos',\s*'fecha_entrega'/,
  );
  assert.match(
    source,
    /removeColumn\(\s*'jornadas_reparto',\s*'retorno_estimado_en'/,
  );
  assert.match(
    source,
    /removeColumn\(\s*'jornadas_reparto',\s*'inicio_estimado_en'/,
  );
  assert.doesNotMatch(
    source,
    /NOW\(\)|CURRENT_TIMESTAMP|UPDATE "jornadas_reparto"|UPDATE "pedidos"/,
  );
});

test('asignar chofer rechaza conflicto activo en la misma fecha sin exponer detalles internos', async (t) => {
  const service = await import('../../src/services/jornadaReparto.service.js');
  const { default: db } = await import('../../src/models/index.js');
  const { default: sequelize } = await import('../../src/config/database.js');
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const jornada = modelInstance({
    id: 700,
    fecha: '2026-08-01',
    estado: 'PLANIFICADA',
  });
  const chofer = modelInstance({
    id: 80,
    activo: true,
    fecha_vencimiento_licencia: '2099-12-31',
    usuario: {
      rol: 'CHOFER',
      estado: true,
    },
  });

  stubMethods(t, sequelize, {
    transaction: async (callback) => callback(transaction),
  });
  stubMethods(t, db.JornadaReparto, {
    findByPk: async () => jornada,
    findOne: async (options) => {
      assert.ok(
        options.where[Op.or].some(
          (item) => item.fecha === '2026-08-01',
        ),
      );
      return { id: 701 };
    },
  });
  stubMethods(t, db.Chofer, {
    findByPk: async () => chofer,
  });

  await assert.rejects(
    () => service.asignarChofer(700, 80),
    (error) => {
      assert.equal(error.code, 'CHOFER_NO_DISPONIBLE');
      assert.doesNotMatch(error.message, /jornadas_reparto|SELECT|unique/i);
      return true;
    },
  );

  assert.equal(jornada.update.mock.callCount(), 0);
});

test('asignar chofer permite jornadas activas del mismo chofer en fechas diferentes', async (t) => {
  const service = await import('../../src/services/jornadaReparto.service.js');
  const { default: db } = await import('../../src/models/index.js');
  const { default: sequelize } = await import('../../src/config/database.js');
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const jornada = modelInstance({
    id: 710,
    fecha: '2026-08-02',
    estado: 'PLANIFICADA',
  });
  const chofer = modelInstance({
    id: 81,
    activo: true,
    fecha_vencimiento_licencia: '2099-12-31',
    usuario: {
      rol: 'CHOFER',
      estado: true,
    },
  });

  stubMethods(t, sequelize, {
    transaction: async (callback) => callback(transaction),
  });
  stubMethods(t, db.JornadaReparto, {
    findByPk: async () => jornada,
    findOne: async (options) => {
      assert.ok(
        options.where[Op.or].some(
          (item) => item.fecha === '2026-08-02',
        ),
      );
      return null;
    },
  });
  stubMethods(t, db.Chofer, {
    findByPk: async () => chofer,
  });

  const resultado = await service.asignarChofer(710, 81);

  assert.equal(resultado.id, 710);
  assert.equal(jornada.chofer_id, 81);
});

test('asignar chofer no bloquea jornadas finalizadas en la misma fecha', async (t) => {
  const service = await import('../../src/services/jornadaReparto.service.js');
  const { default: db } = await import('../../src/models/index.js');
  const { default: sequelize } = await import('../../src/config/database.js');
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const jornada = modelInstance({
    id: 720,
    fecha: '2026-08-03',
    estado: 'PLANIFICADA',
  });
  const chofer = modelInstance({
    id: 82,
    activo: true,
    fecha_vencimiento_licencia: '2099-12-31',
    usuario: {
      rol: 'CHOFER',
      estado: true,
    },
  });

  stubMethods(t, sequelize, {
    transaction: async (callback) => callback(transaction),
  });
  stubMethods(t, db.JornadaReparto, {
    findByPk: async () => jornada,
    findOne: async (options) => {
      const sameDate = options.where[Op.or].find(
        (item) => item.fecha === '2026-08-03',
      );
      assert.deepEqual(
        sameDate.estado[Op.in],
        ['PLANIFICADA', 'EN_RUTA'],
      );
      return null;
    },
  });
  stubMethods(t, db.Chofer, {
    findByPk: async () => chofer,
  });

  await service.asignarChofer(720, 82);

  assert.equal(jornada.chofer_id, 82);
});

test('inicio de jornada rechaza concurrencia de camión o chofer en la misma fecha', async (t) => {
  const service = await import('../../src/services/jornadaReparto.service.js');
  const { default: db } = await import('../../src/models/index.js');
  const { default: sequelize } = await import('../../src/config/database.js');
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const jornada = modelInstance({
    id: 730,
    camion_id: 90,
    chofer_id: 83,
    fecha: '2026-08-04',
    estado: 'PLANIFICADA',
    carga_confirmada_en: new Date(),
  });
  const chofer = modelInstance({
    id: 83,
    usuario_id: 830,
    activo: true,
    fecha_vencimiento_licencia: '2099-12-31',
    usuario: {
      id: 830,
      rol: 'CHOFER',
      estado: true,
    },
  });

  stubMethods(t, sequelize, {
    transaction: async (callback) => callback(transaction),
  });
  stubMethods(t, db.JornadaReparto, {
    findByPk: async () => jornada,
    findOne: async (options) => {
      assert.ok(
        options.where[Op.or].some(
          (item) => item.fecha === '2026-08-04',
        ),
      );
      return { id: 731 };
    },
  });
  stubMethods(t, db.Chofer, {
    findByPk: async () => chofer,
  });

  await assert.rejects(
    () => service.iniciarJornada(730, {
      id: 830,
      rol: 'CHOFER',
    }),
    (error) => {
      assert.equal(error.code, 'CHOFER_NO_DISPONIBLE');
      assert.doesNotMatch(error.message, /jornadas_reparto|SELECT|unique/i);
      return true;
    },
  );
});

test('choferes disponibles solo consideran jornadas activas de la fecha consultada', async (t) => {
  const service = await import('../../src/services/chofer.service.js');
  const { default: db } = await import('../../src/models/index.js');

  stubMethods(t, db.Chofer, {
    findAll: async (options) => {
      const jornadasInclude = options.include.find(
        (item) => item.as === 'jornadas',
      );
      const sameDate = jornadasInclude.where[Op.or].find(
        (item) => item.fecha === '2026-08-05',
      );

      assert.ok(sameDate);

      return [
        modelInstance({
          id: 84,
          activo: true,
          fecha_vencimiento_licencia: '2099-12-31',
          usuario: {
            rol: 'CHOFER',
            estado: true,
          },
          jornadas: [],
        }),
      ];
    },
  });

  const disponibles =
    await service.obtenerDisponibles('2026-08-05');

  assert.equal(disponibles.length, 1);
  assert.equal(disponibles[0].id, 84);
});

test('errorHandler traduce restricciones logísticas sin exponer nombres internos', async () => {
  const { default: errorHandler } = await import(
    `../../src/middlewares/errorHandler.js?logistic=${Date.now()}`
  );

  const cases = [
    [
      'despachos_pedido_activo_unique',
      'PEDIDO_YA_ASIGNADO',
    ],
    [
      'jornadas_reparto_camion_activo_unique',
      'CAMION_NO_DISPONIBLE',
    ],
    [
      'jornadas_reparto_chofer_activo_unique',
      'CHOFER_NO_DISPONIBLE',
    ],
    [
      'jornadas_reparto_camion_en_ruta_unique',
      'CAMION_NO_DISPONIBLE',
    ],
    [
      'jornadas_reparto_chofer_en_ruta_unique',
      'CHOFER_NO_DISPONIBLE',
    ],
    [
      'despachos_jornada_orden_unique',
      'ORDEN_ENTREGA_DUPLICADO',
    ],
  ];

  for (const [constraint, code] of cases) {
    const res = {
      statusCode: null,
      body: null,
      status(statusCode) {
        this.statusCode = statusCode;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };

    errorHandler(
      {
        name: 'SequelizeUniqueConstraintError',
        parent: {
          constraint,
        },
        errors: [
          {
            message: constraint,
          },
        ],
      },
      {},
      res,
      () => {},
    );

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, code);
    assert.doesNotMatch(
      res.body.message,
      new RegExp(constraint),
    );
  }
});

test('recalcular jornada permite compartir orden entre despachos del mismo destino', () => {
  const source = read(
    'src',
    'services',
    'jornadaReparto.service.js',
  );

  assert.match(
    source,
    /incorporadosDirectos\.push\([\s\S]*?despachoReferencia/,
  );
  assert.match(
    source,
    /orden_entrega:\s*despachoReferencia\.orden_entrega/,
  );
  assert.doesNotMatch(
    source,
    /ordenesUsadas\.has\(ordenReferencia\)/,
  );
});

test('migración posterior permite paradas compartidas sin quitar unicidad por pedido', () => {
  const source = read(
    'database',
    'migrations',
    '20260730000100-allow-shared-delivery-orders-per-destination.js',
  );

  assert.match(
    source,
    /DROP INDEX IF EXISTS "despachos_jornada_orden_unique"/,
  );
  assert.doesNotMatch(
    source,
    /despachos_jornada_pedido_unique/,
  );
});
