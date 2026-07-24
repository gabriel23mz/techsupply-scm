import test from 'node:test';
import assert from 'node:assert/strict';

import { modelInstance, stubMethods } from './helpers/testEnv.js';

test('pedidos rechaza finalizar preparación sin detalles y conserva transición válida', async (t) => {
  const service = await import('../../src/services/pedido.service.js');
  const { default: Pedido } = await import('../../src/models/Pedido.js');
  const { default: DetallePedido } = await import('../../src/models/DetallePedido.js');

  const pedido = modelInstance({ id: 3, estado: 'PREPARANDO' });
  let detalles = [];

  stubMethods(t, Pedido, {
    findByPk: async () => pedido,
  });
  stubMethods(t, DetallePedido, {
    findAll: async () => detalles,
  });

  await assert.rejects(
    () => service.finalizarPreparacion(3),
    /debe tener al menos un producto/,
  );

  detalles = [{ id: 1 }];
  await service.finalizarPreparacion(3);

  assert.deepEqual(pedido.update.mock.calls[0].arguments[0], {
    estado: 'LISTO_PARA_DESPACHO',
  });
});

test('detalle de pedido descuenta stock antes de persistir, exponiendo riesgo no atómico actual', async (t) => {
  const service = await import('../../src/services/detallePedido.service.js');
  const { default: Pedido } = await import('../../src/models/Pedido.js');
  const { default: Producto } = await import('../../src/models/Producto.js');
  const { default: DetallePedido } = await import('../../src/models/DetallePedido.js');

  const pedido = modelInstance({ id: 9, estado: 'PENDIENTE' });
  const producto = modelInstance({ id: 4, stock_actual: 5, precio_venta: 12 });

  stubMethods(t, Pedido, {
    findByPk: async () => pedido,
    update: async () => [1],
  });
  stubMethods(t, Producto, {
    findOne: async () => producto,
  });
  stubMethods(t, DetallePedido, {
    create: async () => {
      throw new Error('fallo simulado al crear detalle');
    },
    findAll: async () => [],
  });

  await assert.rejects(
    () => service.crear({ pedido_id: 9, producto_id: 4, cantidad: 2 }),
    /fallo simulado/,
  );

  assert.deepEqual(producto.update.mock.calls[0].arguments[0], {
    stock_actual: 3,
  });
});

test('despachos impide entrega fuera de orden y actualiza pedido al entregar en orden', async (t) => {
  const service = await import('../../src/services/despacho.service.js');
  const { default: Despacho } = await import('../../src/models/Despacho.js');
  const { default: Pedido } = await import('../../src/models/Pedido.js');
  const { default: Ubicacion } = await import('../../src/models/Ubicacion.js');

  const fueraDeOrden = modelInstance({
    id: 20,
    pedido_id: 30,
    estado: 'EN_TRANSITO',
    orden_entrega: 2,
    jornada: { estado: 'EN_RUTA', posicion_actual_orden: 1 },
  });

  stubMethods(t, Despacho, {
    findByPk: async () => fueraDeOrden,
  });

  await assert.rejects(
    () => service.entregarDespacho(20),
    /aún no se encuentra en el punto/,
  );

  fueraDeOrden.orden_entrega = 1;
  stubMethods(t, Pedido, {
    update: async () => [1],
  });
  stubMethods(t, Ubicacion, {
    findAll: async () => [],
  });

  const resultado = await service.entregarDespacho(20);

  assert.equal(resultado.estado, 'ENTREGADO');
  assert.deepEqual(Pedido.update.mock.calls[0].arguments[0], {
    estado: 'ENTREGADO',
  });
});

test('despacho entregado puede quedar parcial si falla actualización de pedido', async (t) => {
  const service = await import('../../src/services/despacho.service.js');
  const { default: Despacho } = await import('../../src/models/Despacho.js');
  const { default: Pedido } = await import('../../src/models/Pedido.js');

  const despacho = modelInstance({
    id: 21,
    pedido_id: 31,
    estado: 'EN_TRANSITO',
    orden_entrega: 1,
    jornada: { estado: 'EN_RUTA', posicion_actual_orden: 1 },
  });

  stubMethods(t, Despacho, {
    findByPk: async () => despacho,
  });
  stubMethods(t, Pedido, {
    update: async () => {
      throw new Error('fallo simulado al actualizar pedido');
    },
  });

  await assert.rejects(
    () => service.entregarDespacho(21),
    /fallo simulado/,
  );

  assert.deepEqual(despacho.update.mock.calls[0].arguments[0].estado, 'ENTREGADO');
});

test('jornada rechaza generación sin pedidos o sin camiones disponibles', async (t) => {
  const service = await import('../../src/services/jornadaReparto.service.js');
  const { default: db } = await import('../../src/models/index.js');

  stubMethods(t, db.Pedido, {
    findAll: async () => [],
  });

  await assert.rejects(
    () => service.generarJornadaReparto(),
    /No existen pedidos listos para despacho/,
  );

  db.Pedido.findAll = async () => [
    {
      id: 1,
      cliente_id: 2,
      Cliente: { nombre: 'Cliente', Ubicacion: { id: 3 } },
    },
  ];
  stubMethods(t, db.JornadaReparto, {
    findAll: async () => [],
  });
  stubMethods(t, db.Camion, {
    findAll: async () => [],
  });

  await assert.rejects(
    () => service.generarJornadaReparto(),
    /No existen camiones disponibles/,
  );
});

test('inicio de jornada exige PLANIFICADA y cambia camión/despachos de forma coherente', async (t) => {
  const service = await import('../../src/services/jornadaReparto.service.js');
  const { default: db } = await import('../../src/models/index.js');
  const { default: sequelize } = await import('../../src/config/database.js');

  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  stubMethods(t, sequelize, {
    transaction: async (callback) => callback(transaction),
  });

  const jornada = modelInstance({ id: 70, camion_id: 5, estado: 'PLANIFICADA' });
  const camion = modelInstance({ id: 5, estado: 'EN_BODEGA' });
  const despachos = [
    modelInstance({ id: 1, estado: 'PENDIENTE', orden_entrega: 2 }),
    modelInstance({ id: 2, estado: 'PENDIENTE', orden_entrega: 1 }),
  ];
  let jornadaFindCount = 0;

  stubMethods(t, db.JornadaReparto, {
    findByPk: async () => {
      jornadaFindCount += 1;
      return jornadaFindCount === 1
        ? jornada
        : { ...jornada, camion, despachos };
    },
  });
  stubMethods(t, db.Camion, {
    findByPk: async () => camion,
  });
  stubMethods(t, db.Despacho, {
    findAll: async () => despachos,
    update: async () => [2],
  });

  const resultado = await service.iniciarJornada(70);

  assert.equal(resultado.estado, 'EN_RUTA');
  assert.deepEqual(jornada.update.mock.calls[0].arguments[0].posicion_actual_orden, 1);
  assert.deepEqual(camion.update.mock.calls[0].arguments[0], { estado: 'EN_RUTA' });
  assert.deepEqual(db.Despacho.update.mock.calls[0].arguments[0].estado, 'EN_TRANSITO');
});

test('jornada no avanza mientras el punto actual tenga despachos abiertos', async (t) => {
  const service = await import('../../src/services/jornadaReparto.service.js');
  const { default: db } = await import('../../src/models/index.js');
  const jornada = modelInstance({
    id: 77,
    estado: 'EN_RUTA',
    posicion_actual_orden: 1,
    despachos: [
      { id: 1, orden_entrega: 1, estado: 'EN_TRANSITO' },
      { id: 2, orden_entrega: 2, estado: 'EN_TRANSITO' },
    ],
  });

  stubMethods(t, db.JornadaReparto, {
    findByPk: async () => jornada,
  });

  await assert.rejects(
    () => service.avanzarJornada(77),
    /No se puede avanzar/,
  );
});
