import test from 'node:test';
import assert from 'node:assert/strict';

import {
  modelInstance,
  stubManagedTransaction,
  stubMethods,
} from './helpers/testEnv.js';

test('pedidos rechaza finalizar preparación sin detalles y conserva transición válida', async (t) => {
  const service = await import('../../src/services/pedido.service.js');
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: Pedido } = await import('../../src/models/Pedido.js');
  const { default: DetallePedido } = await import('../../src/models/DetallePedido.js');

  const pedido = modelInstance({ id: 3, estado: 'PREPARANDO' });
  let detalles = [];

  stubManagedTransaction(t, sequelize);
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

  detalles = [
    {
      id: 1,
      cantidad: 2,
      cantidad_preparada: 2,
    },
  ];
  await service.finalizarPreparacion(3);

  assert.equal(
    pedido.update.mock.calls[0].arguments[0].estado,
    'LISTO_PARA_DESPACHO',
  );
  assert.ok(
    pedido.update.mock.calls[0].arguments[0]
      .preparacion_finalizada_en instanceof Date,
  );
});

test('detalle de pedido revierte stock si falla la creación del detalle', async (t) => {
  const service = await import('../../src/services/detallePedido.service.js');
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: Pedido } = await import('../../src/models/Pedido.js');
  const { default: Producto } = await import('../../src/models/Producto.js');
  const { default: DetallePedido } = await import('../../src/models/DetallePedido.js');

  const pedido = modelInstance({ id: 9, estado: 'PENDIENTE' });
  const producto = modelInstance({ id: 4, stock_actual: 5, precio_venta: 12 });

  stubManagedTransaction(t, sequelize);
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

  assert.equal(producto.stock_actual, 5);
  assert.equal(DetallePedido.create.mock.callCount(), 1);
});

test('detalle de pedido revierte stock y detalle si falla recalcular total', async (t) => {
  const service = await import('../../src/services/detallePedido.service.js');
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: Pedido } = await import('../../src/models/Pedido.js');
  const { default: Producto } = await import('../../src/models/Producto.js');
  const { default: DetallePedido } = await import('../../src/models/DetallePedido.js');

  const pedido = modelInstance({ id: 10, estado: 'PENDIENTE', total: 0 });
  const producto = modelInstance({ id: 5, stock_actual: 4, precio_venta: 15 });
  const detallesCreados = [];

  stubManagedTransaction(t, sequelize);
  stubMethods(t, Pedido, {
    findByPk: async () => pedido,
    update: async () => {
      throw new Error('fallo simulado al recalcular total');
    },
  });
  stubMethods(t, Producto, {
    findOne: async () => producto,
  });
  stubMethods(t, DetallePedido, {
    create: async (datos, options) => {
      const detalle = modelInstance({ id: 55, ...datos });
      options.transaction.record(detallesCreados, { length: detallesCreados.length });
      detallesCreados.push(detalle);
      return detalle;
    },
    findAll: async () => detallesCreados,
  });

  await assert.rejects(
    () => service.crear({ pedido_id: 10, producto_id: 5, cantidad: 1 }),
    /fallo simulado al recalcular total/,
  );

  assert.equal(producto.stock_actual, 4);
  assert.equal(detallesCreados.length, 0);
  assert.equal(pedido.total, 0);
});

test('detalle de pedido revierte stock si falla actualización de detalle', async (t) => {
  const service = await import('../../src/services/detallePedido.service.js');
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: Pedido } = await import('../../src/models/Pedido.js');
  const { default: Producto } = await import('../../src/models/Producto.js');
  const { default: DetallePedido } = await import('../../src/models/DetallePedido.js');

  const detalle = modelInstance({
    id: 80,
    pedido_id: 10,
    producto_id: 5,
    cantidad: 1,
    precio_unitario: 15,
    subtotal: 15,
  });
  detalle.update = t.mock.fn(async () => {
    throw new Error('fallo simulado al actualizar detalle');
  });
  const pedido = modelInstance({ id: 10, estado: 'PENDIENTE', total: 15 });
  const producto = modelInstance({ id: 5, stock_actual: 4 });

  stubManagedTransaction(t, sequelize);
  stubMethods(t, Pedido, {
    findByPk: async () => pedido,
  });
  stubMethods(t, Producto, {
    findByPk: async () => producto,
  });
  stubMethods(t, DetallePedido, {
    findByPk: async () => detalle,
    findAll: async () => [detalle],
  });

  await assert.rejects(
    () => service.actualizar(80, { cantidad: 3 }),
    /fallo simulado al actualizar detalle/,
  );

  assert.equal(producto.stock_actual, 4);
  assert.equal(detalle.cantidad, 1);
  assert.equal(detalle.subtotal, 15);
});

test('detalle de pedido revierte stock si falla eliminación del detalle', async (t) => {
  const service = await import('../../src/services/detallePedido.service.js');
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: Pedido } = await import('../../src/models/Pedido.js');
  const { default: Producto } = await import('../../src/models/Producto.js');
  const { default: DetallePedido } = await import('../../src/models/DetallePedido.js');

  const detalle = modelInstance({
    id: 81,
    pedido_id: 10,
    producto_id: 5,
    cantidad: 2,
    precio_unitario: 15,
    subtotal: 30,
  });
  detalle.destroy = t.mock.fn(async () => {
    throw new Error('fallo simulado al eliminar detalle');
  });
  const pedido = modelInstance({ id: 10, estado: 'PENDIENTE', total: 30 });
  const producto = modelInstance({ id: 5, stock_actual: 4 });

  stubManagedTransaction(t, sequelize);
  stubMethods(t, Pedido, {
    findByPk: async () => pedido,
  });
  stubMethods(t, Producto, {
    findByPk: async () => producto,
  });
  stubMethods(t, DetallePedido, {
    findByPk: async () => detalle,
    findAll: async () => [detalle],
  });

  await assert.rejects(
    () => service.eliminar(81),
    /fallo simulado al eliminar detalle/,
  );

  assert.equal(producto.stock_actual, 4);
  assert.equal(detalle.destroyed, undefined);
});

test('despachos impide entrega fuera de orden y actualiza pedido al entregar en orden', async (t) => {
  const service = await import('../../src/services/despacho.service.js');
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: Despacho } = await import('../../src/models/Despacho.js');
  const { default: Pedido } = await import('../../src/models/Pedido.js');
  const { default: Ubicacion } = await import('../../src/models/Ubicacion.js');
  const { default: JornadaReparto } = await import('../../src/models/JornadaReparto.js');

  const fueraDeOrden = modelInstance({
    id: 20,
    pedido_id: 30,
    jornada_reparto_id: 40,
    estado: 'EN_TRANSITO',
    orden_entrega: 2,
  });
  const pedido = modelInstance({ id: 30, estado: 'DESPACHADO' });
  const jornada = modelInstance({ id: 40, estado: 'EN_RUTA', posicion_actual_orden: 1 });

  stubManagedTransaction(t, sequelize);
  stubMethods(t, Despacho, {
    findByPk: async () => fueraDeOrden,
    findAll: async () => [
      fueraDeOrden,
      { id: 99, orden_entrega: 2, estado: 'EN_TRANSITO' },
    ],
  });
  stubMethods(t, Pedido, {
    findByPk: async () => pedido,
  });
  stubMethods(t, JornadaReparto, {
    findByPk: async () => jornada,
  });

  await assert.rejects(
    () => service.entregarDespacho(20),
    /aún no se encuentra en el punto/,
  );

  fueraDeOrden.orden_entrega = 1;
  stubMethods(t, Ubicacion, {
    findAll: async () => [],
  });

  const resultado = await service.entregarDespacho(20);

  assert.equal(resultado.estado, 'ENTREGADO');
  assert.equal(pedido.estado, 'ENTREGADO');
  assert.equal(jornada.posicion_actual_orden, 2);
});

test('despacho revierte entrega si falla actualización de pedido', async (t) => {
  const service = await import('../../src/services/despacho.service.js');
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: Despacho } = await import('../../src/models/Despacho.js');
  const { default: Pedido } = await import('../../src/models/Pedido.js');
  const { default: JornadaReparto } = await import('../../src/models/JornadaReparto.js');

  const despacho = modelInstance({
    id: 21,
    pedido_id: 31,
    jornada_reparto_id: 41,
    estado: 'EN_TRANSITO',
    orden_entrega: 1,
  });
  const pedido = modelInstance({ id: 31, estado: 'DESPACHADO' });
  pedido.update = t.mock.fn(async () => {
    throw new Error('fallo simulado al actualizar pedido');
  });
  const jornada = modelInstance({ id: 41, estado: 'EN_RUTA', posicion_actual_orden: 1 });

  stubManagedTransaction(t, sequelize);
  stubMethods(t, Despacho, {
    findByPk: async () => despacho,
  });
  stubMethods(t, Pedido, {
    findByPk: async () => pedido,
  });
  stubMethods(t, JornadaReparto, {
    findByPk: async () => jornada,
  });

  await assert.rejects(
    () => service.entregarDespacho(21),
    /fallo simulado/,
  );

  assert.equal(despacho.estado, 'EN_TRANSITO');
  assert.equal(pedido.estado, 'DESPACHADO');
});

test('despacho revierte entrega si falla avance de jornada', async (t) => {
  const service = await import('../../src/services/despacho.service.js');
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: Despacho } = await import('../../src/models/Despacho.js');
  const { default: Pedido } = await import('../../src/models/Pedido.js');
  const { default: JornadaReparto } = await import('../../src/models/JornadaReparto.js');

  const despacho = modelInstance({
    id: 22,
    pedido_id: 32,
    jornada_reparto_id: 42,
    estado: 'EN_TRANSITO',
    orden_entrega: 1,
  });
  const pedido = modelInstance({ id: 32, estado: 'DESPACHADO' });
  const jornada = modelInstance({ id: 42, estado: 'EN_RUTA', posicion_actual_orden: 1 });
  jornada.update = t.mock.fn(async () => {
    throw new Error('fallo simulado al avanzar jornada');
  });

  stubManagedTransaction(t, sequelize);
  stubMethods(t, Despacho, {
    findByPk: async () => despacho,
    findAll: async () => [
      despacho,
      { id: 33, orden_entrega: 2, estado: 'EN_TRANSITO' },
    ],
  });
  stubMethods(t, Pedido, {
    findByPk: async () => pedido,
  });
  stubMethods(t, JornadaReparto, {
    findByPk: async () => jornada,
  });

  await assert.rejects(
    () => service.entregarDespacho(22),
    /fallo simulado al avanzar jornada/,
  );

  assert.equal(despacho.estado, 'EN_TRANSITO');
  assert.equal(pedido.estado, 'DESPACHADO');
  assert.equal(jornada.posicion_actual_orden, 1);
});

test('despacho rechaza doble entrega con estado controlado', async (t) => {
  const service = await import('../../src/services/despacho.service.js');
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: Despacho } = await import('../../src/models/Despacho.js');
  const { default: Pedido } = await import('../../src/models/Pedido.js');
  const { default: JornadaReparto } = await import('../../src/models/JornadaReparto.js');

  stubManagedTransaction(t, sequelize);
  stubMethods(t, Despacho, {
    findByPk: async () => modelInstance({
      id: 23,
      pedido_id: 33,
      jornada_reparto_id: 43,
      estado: 'ENTREGADO',
      orden_entrega: 1,
    }),
  });
  stubMethods(t, Pedido, {
    findByPk: async () => modelInstance({ id: 33, estado: 'ENTREGADO' }),
  });
  stubMethods(t, JornadaReparto, {
    findByPk: async () => modelInstance({ id: 43, estado: 'EN_RUTA', posicion_actual_orden: 1 }),
  });

  await assert.rejects(
    () => service.entregarDespacho(23),
    /Solo se pueden entregar despachos en estado EN_TRANSITO/,
  );
});

test('despacho no entregado actualiza pedido y avanza jornada de forma atómica', async (t) => {
  const service = await import('../../src/services/despacho.service.js');
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: Despacho } = await import('../../src/models/Despacho.js');
  const { default: Pedido } = await import('../../src/models/Pedido.js');
  const { default: JornadaReparto } = await import('../../src/models/JornadaReparto.js');

  const despacho = modelInstance({
    id: 24,
    pedido_id: 34,
    jornada_reparto_id: 44,
    estado: 'EN_TRANSITO',
    orden_entrega: 1,
  });
  const pedido = modelInstance({ id: 34, estado: 'DESPACHADO' });
  const jornada = modelInstance({ id: 44, estado: 'EN_RUTA', posicion_actual_orden: 1 });

  stubManagedTransaction(t, sequelize);
  stubMethods(t, Despacho, {
    findByPk: async () => despacho,
    findAll: async () => [
      despacho,
      { id: 35, orden_entrega: 2, estado: 'EN_TRANSITO' },
    ],
  });
  stubMethods(t, Pedido, {
    findByPk: async () => pedido,
  });
  stubMethods(t, JornadaReparto, {
    findByPk: async () => jornada,
  });

  const resultado = await service.marcarNoEntregado(24);

  assert.equal(resultado.estado, 'NO_ENTREGADO');
  assert.equal(pedido.estado, 'REPROGRAMADO');
  assert.equal(jornada.posicion_actual_orden, 2);
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
      cliente: { nombre: 'Cliente', ubicacion: { id: 3 } },
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

  const jornada = modelInstance({
    id: 70,
    camion_id: 5,
    chofer_id: 8,
    estado: 'PLANIFICADA',
    carga_confirmada_en: new Date(),
  });
  const chofer = modelInstance({
    id: 8,
    usuario_id: 88,
    activo: true,
    fecha_vencimiento_licencia: '2099-12-31',
    usuario: {
      id: 88,
      rol: 'CHOFER',
      estado: true,
    },
  });
  const camion = modelInstance({ id: 5, estado: 'EN_BODEGA' });
  const despachos = [
    modelInstance({
      id: 1,
      pedido_id: 701,
      estado: 'PENDIENTE',
      orden_entrega: 2,
      cargado: true,
    }),
    modelInstance({
      id: 2,
      pedido_id: 702,
      estado: 'PENDIENTE',
      orden_entrega: 1,
      cargado: true,
    }),
  ];
  let jornadaFindCount = 0;

  stubMethods(t, db.JornadaReparto, {
    findByPk: async () => {
      jornadaFindCount += 1;
      return jornadaFindCount === 1
        ? jornada
        : { ...jornada, camion, despachos };
    },
    findOne: async () => null,
  });
  stubMethods(t, db.Chofer, {
    findByPk: async () => chofer,
  });
  stubMethods(t, db.Camion, {
    findByPk: async () => camion,
  });
  stubMethods(t, db.Despacho, {
    findAll: async () => despachos,
    update: async () => [2],
  });
  stubMethods(t, db.Pedido, {
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
