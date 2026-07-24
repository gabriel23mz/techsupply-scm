import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';

import {
  modelInstance,
  stubManagedTransaction,
  stubMethods,
} from './helpers/testEnv.js';
import {
  respuestaJornadaValida,
  solicitudJornadaValida,
} from './fixtures/nodePythonContracts.js';

const post = mock.fn(async () => ({
  data: respuestaJornadaValida,
}));
const originalCreate = axios.create;
axios.create = () => ({ post });

const service =
  await import('../../src/services/jornadaReparto.service.js');

axios.create = originalCreate;

function pedido(id = 100) {
  return {
    id,
    cliente_id: 20,
    estado: 'LISTO_PARA_DESPACHO',
    Cliente: {
      nombre: 'Cliente Demo',
      Ubicacion: {
        id: 3,
        nombre: 'Sucursal Norte',
        latitud: -2.08,
        longitud: -79.88,
      },
    },
  };
}

function camion(id = 10) {
  return modelInstance({
    id,
    codigo: `CAM-${id}`,
    placa: `ABC-${id}`,
    estado: 'EN_BODEGA',
    capacidad: 2,
  });
}

function bodega() {
  return {
    ...solicitudJornadaValida.bodega,
  };
}

function ruta() {
  return {
    origen_id: 1,
    destino_id: 3,
    distancia_km: 6,
  };
}

function planValido(overrides = {}) {
  return {
    ...respuestaJornadaValida,
    ...overrides,
  };
}

function stubPreliminares(t, db, options = {}) {
  const pedidos = options.pedidos ?? [pedido()];
  const camiones = options.camiones ?? [camion()];

  stubMethods(t, db.Pedido, {
    findAll: async () => pedidos,
    update: async () => [1],
  });
  stubMethods(t, db.JornadaReparto, {
    findAll: async () => [],
    findOne: async () => null,
    create: async (datos) =>
      modelInstance({
        id: options.jornadaId ?? 500,
        ...datos,
      }),
  });
  stubMethods(t, db.Camion, {
    findAll: async () => camiones,
    findByPk: async () => camiones[0],
  });
  stubMethods(t, db.Ubicacion, {
    findByPk: async () => bodega(),
  });
  stubMethods(t, db.Ruta, {
    findAll: async () => [ruta()],
  });
  stubMethods(t, db.Despacho, {
    findAll: async () => [],
    create: async (datos) =>
      modelInstance({
        id: options.despachoId ?? 900,
        ...datos,
      }),
  });
}

test('generación de jornada revalida recursos y emite payload jornadaCreada real después del commit', async (t) => {
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: db } = await import('../../src/models/index.js');
  const eventos = [];
  const originalLog = console.log;

  console.log = (...args) => {
    eventos.push(args);
  };
  t.after(() => {
    console.log = originalLog;
  });

  post.mock.mockImplementationOnce(async () => ({
    data: planValido(),
  }));

  stubManagedTransaction(t, sequelize);
  stubPreliminares(t, db);

  const resultado =
    await service.generarJornadaReparto();

  assert.equal(resultado.total_jornadas, 1);
  assert.equal(resultado.total_pedidos_asignados, 1);

  const payload = eventos
    .flat()
    .find(
      (item) =>
        item &&
        typeof item === 'object' &&
        'jornada' in item &&
        'despachos' in item,
    );

  assert.equal(payload.jornada.id, 500);
  assert.equal(payload.despachos[0].pedido_id, 100);
});

test('generación aborta si el camión se ocupa entre Python y la persistencia', async (t) => {
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: db } = await import('../../src/models/index.js');

  post.mock.mockImplementationOnce(async () => ({
    data: planValido(),
  }));

  stubManagedTransaction(t, sequelize);
  stubPreliminares(t, db);
  db.JornadaReparto.findOne = async () => ({ id: 777 });

  await assert.rejects(
    () => service.generarJornadaReparto(),
    /ya posee una jornada activa/,
  );

  assert.equal(db.JornadaReparto.create.mock.callCount(), 0);
});

test('generación aborta si el pedido ya tiene despacho activo al revalidar', async (t) => {
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: db } = await import('../../src/models/index.js');

  post.mock.mockImplementationOnce(async () => ({
    data: planValido(),
  }));

  stubManagedTransaction(t, sequelize);
  stubPreliminares(t, db);
  db.Despacho.findAll = async () => [
    { id: 300, pedido_id: 100, estado: 'PENDIENTE' },
  ];

  await assert.rejects(
    () => service.generarJornadaReparto(),
    /ya poseen un despacho activo/,
  );

  assert.equal(db.JornadaReparto.create.mock.callCount(), 0);
});

test('generación revierte jornada y pedido si falla crear despacho', async (t) => {
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: db } = await import('../../src/models/index.js');
  const pedidos = [modelInstance(pedido())];
  const jornadas = [];

  post.mock.mockImplementationOnce(async () => ({
    data: planValido(),
  }));

  stubManagedTransaction(t, sequelize);
  stubPreliminares(t, db, { pedidos });
  db.JornadaReparto.create = mock.fn(async (datos, options) => {
    options.transaction.record(jornadas, { length: jornadas.length });
    const jornada = modelInstance({ id: 600, ...datos });
    jornadas.push(jornada);
    return jornada;
  });
  db.Pedido.update = async (_datos, options) => {
    options.transaction.record(pedidos[0], {
      estado: pedidos[0].estado,
    });
    pedidos[0].estado = 'DESPACHADO';
    return [1];
  };
  db.Despacho.create = async () => {
    throw new Error('fallo simulado al crear despacho');
  };

  await assert.rejects(
    () => service.generarJornadaReparto(),
    /fallo simulado al crear despacho/,
  );

  assert.equal(jornadas.length, 0);
  assert.equal(pedidos[0].estado, 'LISTO_PARA_DESPACHO');
});

test('generación revierte si falla actualizar uno de varios pedidos', async (t) => {
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: db } = await import('../../src/models/index.js');
  const pedidos = [
    modelInstance(pedido(100)),
    modelInstance(pedido(101)),
  ];
  const despachos = [];
  const respuesta = structuredClone(respuestaJornadaValida);
  respuesta.jornadas[0].entregas.push({
    ...respuesta.jornadas[0].entregas[0],
    pedido_id: 101,
    orden_entrega: 1,
  });

  post.mock.mockImplementationOnce(async () => ({
    data: respuesta,
  }));

  stubManagedTransaction(t, sequelize);
  stubPreliminares(t, db, { pedidos });
  db.Pedido.update = async (_datos, options) => {
    const pedidoId = Number(options.where.id);
    const item = pedidos.find((actual) => actual.id === pedidoId);

    if (pedidoId === 101) {
      return [0];
    }

    options.transaction.record(item, {
      estado: item.estado,
    });
    item.estado = 'DESPACHADO';
    return [1];
  };
  db.Despacho.create = async (datos, options) => {
    options.transaction.record(despachos, { length: despachos.length });
    const despacho = modelInstance({ id: 800 + despachos.length, ...datos });
    despachos.push(despacho);
    return despacho;
  };

  await assert.rejects(
    () => service.generarJornadaReparto(),
    /ya no está disponible para despacho/,
  );

  assert.equal(despachos.length, 0);
  assert.deepEqual(
    pedidos.map((item) => item.estado),
    ['LISTO_PARA_DESPACHO', 'LISTO_PARA_DESPACHO'],
  );
});

test('generación rechaza dos planes con el mismo camión o el mismo pedido', async (t) => {
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: db } = await import('../../src/models/index.js');
  const duplicadoCamion = structuredClone(respuestaJornadaValida);
  duplicadoCamion.jornadas.push(
    structuredClone(duplicadoCamion.jornadas[0]),
  );

  post.mock.mockImplementationOnce(async () => ({
    data: duplicadoCamion,
  }));

  stubManagedTransaction(t, sequelize);
  stubPreliminares(t, db);

  await assert.rejects(
    () => service.generarJornadaReparto(),
    /camión duplicado/,
  );

  const duplicadoPedido = structuredClone(respuestaJornadaValida);
  duplicadoPedido.jornadas.push({
    ...structuredClone(duplicadoPedido.jornadas[0]),
    camion_id: 11,
  });

  post.mock.mockImplementationOnce(async () => ({
    data: duplicadoPedido,
  }));
  db.Camion.findAll = async () => [camion(10), camion(11)];
  db.Camion.findByPk = async (id) => camion(id);

  await assert.rejects(
    () => service.generarJornadaReparto(),
    /pedido duplicado/,
  );
});
