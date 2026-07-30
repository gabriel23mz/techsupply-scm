import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { Op } from 'sequelize';

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

function pedido(id = 100, ubicacionId = 3) {
  return {
    id,
    cliente_id: 20,
    estado: 'LISTO_PARA_DESPACHO',
    cliente: {
      nombre: 'Cliente Demo',
      ubicacion: {
        id: ubicacionId,
        nombre: ubicacionId === 3 ? 'Sucursal Norte' : `Sucursal ${ubicacionId}`,
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

function chofer(id = 30) {
  return modelInstance({
    id,
    activo: true,
    fecha_vencimiento_licencia: '2099-12-31',
    usuario: {
      rol: 'CHOFER',
      estado: true,
    },
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
  const choferes = options.choferes ?? [chofer()];

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
  stubMethods(t, db.Chofer, {
    findAll: async () => choferes,
    findByPk: async (id) =>
      choferes.find(
        (item) => Number(item.id) === Number(id),
      ) ?? choferes[0],
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

test('generación de jornada revalida recursos y emite un resumen n8n real después del commit', async (t) => {
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: db } = await import('../../src/models/index.js');
  const n8nService = await import('../../src/services/n8n.service.js');
  const originalN8nPost = axios.post;
  const originalN8nEnabled = process.env.N8N_ENABLED;
  const webhookPost = mock.fn(async () => ({ status: 200 }));

  axios.post = webhookPost;
  process.env.N8N_ENABLED = 'true';

  t.after(async () => {
    await n8nService.flushJornadasCreadasPendientes();
    axios.post = originalN8nPost;
    process.env.N8N_ENABLED = originalN8nEnabled;
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

  await n8nService.flushJornadasCreadasPendientes();

  assert.equal(webhookPost.mock.calls.length, 1);

  const payload = webhookPost.mock.calls[0].arguments[1];

  assert.equal(payload.evento, 'JORNADA_CREADA');
  assert.equal(payload.datos.resumen.total_jornadas, 1);
  assert.equal(payload.datos.resumen.pedidos_asignados, 1);
  assert.equal(payload.datos.jornadas[0].id, 500);
  assert.equal(payload.datos.jornadas[0].total_pedidos, 1);
});

test('generación bloquea el chofer mediante INNER JOIN compatible con PostgreSQL', async (t) => {
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: db } = await import('../../src/models/index.js');
  let lockOptions;

  post.mock.mockImplementationOnce(async () => ({
    data: planValido(),
  }));

  stubManagedTransaction(t, sequelize);
  stubPreliminares(t, db);

  db.Chofer.findByPk = async (id, options) => {
    lockOptions = options;
    return chofer(id);
  };

  await service.generarJornadaReparto();

  const usuarioInclude = lockOptions.include.find(
    (include) => include.as === 'usuario',
  );

  assert.equal(lockOptions.lock, 'UPDATE');
  assert.equal(usuarioInclude.required, true);
});

test('generación diaria rechaza fechas fuera de la fecha operativa', async () => {
  await assert.rejects(
    () => service.generarJornadaReparto({
      fecha: '2026-07-24',
      now: new Date('2026-07-25T15:00:00.000Z'),
    }),
    (error) => {
      assert.equal(
        error.code,
        'GENERACION_FUERA_DE_FECHA_OPERATIVA',
      );
      return true;
    },
  );

  await assert.rejects(
    () => service.generarJornadaReparto({
      fecha: '2026-07-26',
      now: new Date('2026-07-25T15:00:00.000Z'),
    }),
    (error) => {
      assert.equal(
        error.code,
        'GENERACION_FUERA_DE_FECHA_OPERATIVA',
      );
      return true;
    },
  );
});

test('generación limita camiones por cantidad de choferes disponibles', async (t) => {
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: db } = await import('../../src/models/index.js');

  post.mock.mockImplementationOnce(async (url, payload) => {
    assert.equal(payload.camiones.length, 1);
    assert.equal(payload.camiones[0].id, 10);

    return {
      data: planValido(),
    };
  });

  stubManagedTransaction(t, sequelize);
  stubPreliminares(t, db, {
    camiones: [camion(10), camion(11)],
    choferes: [chofer(30)],
  });

  const resultado =
    await service.generarJornadaReparto();

  assert.equal(resultado.total_jornadas, 1);
  assert.equal(
    db.JornadaReparto.create.mock.calls[0].arguments[0].chofer_id,
    30,
  );
});

test('generación rechaza cero choferes disponibles', async (t) => {
  const { default: db } = await import('../../src/models/index.js');

  stubPreliminares(t, db, {
    choferes: [],
  });

  await assert.rejects(
    () => service.generarJornadaReparto(),
    (error) => {
      assert.equal(
        error.code,
        'CHOFERES_NO_DISPONIBLES',
      );
      return true;
    },
  );
});

test('generación revierte si el chofer deja de estar disponible antes de persistir', async (t) => {
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: db } = await import('../../src/models/index.js');

  post.mock.mockImplementationOnce(async () => ({
    data: planValido(),
  }));

  stubManagedTransaction(t, sequelize);
  stubPreliminares(t, db);
  db.Chofer.findByPk = async () =>
    modelInstance({
      id: 30,
      activo: false,
      fecha_vencimiento_licencia: '2099-12-31',
      usuario: {
        rol: 'CHOFER',
        estado: true,
      },
    });

  await assert.rejects(
    () => service.generarJornadaReparto(),
    (error) => {
      assert.equal(error.code, 'CHOFER_NO_DISPONIBLE');
      return true;
    },
  );

  assert.equal(
    db.JornadaReparto.create.mock.callCount(),
    0,
  );
});

test('generación aborta si el camión se ocupa en la misma fecha entre Python y la persistencia', async (t) => {
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: db } = await import('../../src/models/index.js');

  post.mock.mockImplementationOnce(async () => ({
    data: planValido(),
  }));

  stubManagedTransaction(t, sequelize);
  stubPreliminares(t, db);
  db.JornadaReparto.findOne = async (options) => {
    assert.ok(
      options.where[Op.or].some(
        (item) => typeof item.fecha === 'string',
      ),
    );
    assert.equal(options.where.camion_id, 10);

    return { id: 777 };
  };

  await assert.rejects(
    () => service.generarJornadaReparto(),
    (error) => {
      assert.equal(error.code, 'CAMION_NO_DISPONIBLE');
      assert.match(error.message, /misma fecha|fecha/);

      return true;
    },
  );

  assert.equal(db.JornadaReparto.create.mock.callCount(), 0);
});

test('generación permite usar el mismo camión si la jornada activa es de otra fecha', async (t) => {
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: db } = await import('../../src/models/index.js');
  const fechasConsultadas = [];

  post.mock.mockImplementationOnce(async () => ({
    data: planValido(),
  }));

  stubManagedTransaction(t, sequelize);
  stubPreliminares(t, db);

  db.JornadaReparto.findAll = async (options) => {
    fechasConsultadas.push(
      options.where[Op.or]?.find((item) => item.fecha)?.fecha,
    );

    return [];
  };
  db.JornadaReparto.findOne = async (options) => {
    fechasConsultadas.push(
      options.where[Op.or]?.find((item) => item.fecha)?.fecha,
    );

    return null;
  };

  const resultado =
    await service.generarJornadaReparto();

  assert.equal(resultado.total_jornadas, 1);
  assert.equal(
    db.JornadaReparto.create.mock.calls[0].arguments[0].camion_id,
    10,
  );
  assert.ok(
    fechasConsultadas.every(
      (fecha) =>
        typeof fecha === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(fecha),
    ),
  );
});

test('generación no bloquea un camión con jornada finalizada en la misma fecha', async (t) => {
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: db } = await import('../../src/models/index.js');

  post.mock.mockImplementationOnce(async () => ({
    data: planValido(),
  }));

  stubManagedTransaction(t, sequelize);
  stubPreliminares(t, db, {
    choferes: [chofer(30), chofer(31)],
  });

  db.JornadaReparto.findAll = async (options) => {
    assert.ok(options.where[Op.or]);

    return [];
  };
  db.JornadaReparto.findOne = async (options) => {
    assert.ok(options.where[Op.or]);

    return null;
  };

  const resultado =
    await service.generarJornadaReparto();

  assert.equal(resultado.total_jornadas, 1);
});

test('generación aborta si el pedido ya tiene despacho activo al revalidar', async (t) => {
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: db } = await import('../../src/models/index.js');

  post.mock.mockImplementationOnce(async () => ({
    data: planValido(),
  }));

  stubManagedTransaction(t, sequelize);
  stubPreliminares(t, db, {
    choferes: [chofer(30), chofer(31)],
  });
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

test('generación revierte si un pedido deja de estar disponible al revalidar', async (t) => {
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: db } = await import('../../src/models/index.js');
  const pedidos = [
    modelInstance(pedido(100)),
    modelInstance(pedido(101, 4)),
  ];
  const despachos = [];
  const respuesta = structuredClone(respuestaJornadaValida);
  respuesta.jornadas[0].entregas.push({
    ...respuesta.jornadas[0].entregas[0],
    pedido_id: 101,
    orden_entrega: 2,
    ruta_parcial: {
      ...respuesta.jornadas[0].entregas[0].ruta_parcial,
      hasta: {
        id: 4,
        nombre: 'Sucursal 4',
        latitud: -2.12,
        longitud: -79.84,
      },
    },
  });

  post.mock.mockImplementationOnce(async () => ({
    data: respuesta,
  }));

  stubManagedTransaction(t, sequelize);
  stubPreliminares(t, db, { pedidos });
  db.Pedido.findAll = async (options) => {
    if (options?.lock) {
      return [pedidos[0]];
    }

    return pedidos;
  };
  db.Despacho.create = async (datos, options) => {
    options.transaction.record(despachos, { length: despachos.length });
    const despacho = modelInstance({ id: 800 + despachos.length, ...datos });
    despachos.push(despacho);
    return despacho;
  };

  await assert.rejects(
    () => service.generarJornadaReparto(),
    /ya no están disponibles para despacho/,
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
  db.Chofer.findAll = async () => [chofer(30), chofer(31)];
  db.Chofer.findByPk = async (id) => chofer(id);

  await assert.rejects(
    () => service.generarJornadaReparto(),
    /pedido duplicado/,
  );
});

test('generación permite compartir orden entre despachos del mismo destino', async (t) => {
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
    orden_entrega: respuesta.jornadas[0].entregas[0].orden_entrega,
  });

  post.mock.mockImplementationOnce(async () => ({
    data: respuesta,
  }));

  stubManagedTransaction(t, sequelize);
  stubPreliminares(t, db, { pedidos });
  db.Despacho.create = async (datos) => {
    const despacho = modelInstance({ id: 900 + despachos.length, ...datos });
    despachos.push(despacho);
    return despacho;
  };

  const resultado = await service.generarJornadaReparto();

  assert.equal(resultado.total_pedidos_asignados, 2);
  assert.equal(despachos.length, 2);
  assert.deepEqual(
    despachos.map((item) => item.orden_entrega),
    [1, 1],
  );
});

test('generación rechaza el mismo orden cuando apunta a destinos diferentes', async (t) => {
  const { default: sequelize } = await import('../../src/config/database.js');
  const { default: db } = await import('../../src/models/index.js');
  const pedidos = [
    pedido(100),
    pedido(101, 4),
  ];
  const respuesta = structuredClone(respuestaJornadaValida);
  respuesta.jornadas[0].entregas.push({
    ...respuesta.jornadas[0].entregas[0],
    pedido_id: 101,
    orden_entrega: respuesta.jornadas[0].entregas[0].orden_entrega,
    ruta_parcial: {
      ...respuesta.jornadas[0].entregas[0].ruta_parcial,
      hasta: {
        id: 4,
        nombre: 'Sucursal 4',
        latitud: -2.12,
        longitud: -79.84,
      },
    },
  });

  post.mock.mockImplementationOnce(async () => ({
    data: respuesta,
  }));

  stubManagedTransaction(t, sequelize);
  stubPreliminares(t, db, { pedidos });

  await assert.rejects(
    () => service.generarJornadaReparto(),
    /reutiliza el orden 1 para destinos diferentes/,
  );

  assert.equal(db.JornadaReparto.create.mock.callCount(), 0);
});
