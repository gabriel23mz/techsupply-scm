import test, { mock } from 'node:test';
import assert from 'node:assert/strict';

import { modelInstance, stubMethods } from './helpers/testEnv.js';
import {
  respuestaJornadaValida,
  respuestaRutaValida,
  solicitudJornadaValida,
  solicitudRutaValida,
} from './fixtures/nodePythonContracts.js';

test('auth login normaliza correo, excluye password_hash y devuelve token verificable', async (t) => {
  const bcrypt = await import('bcrypt');
  const service = await import('../../src/services/auth.service.js');
  const { verifyAuthToken } = await import('../../src/utils/authToken.js');
  const { default: Usuario } = await import('../../src/models/Usuario.js');

  const usuario = modelInstance({
    id: 1,
    nombre: 'Ana',
    rol: 'ADMIN',
    estado: true,
    password_hash: 'hash',
  });

  stubMethods(t, Usuario, {
    findOne: async (query) => {
      assert.deepEqual(query.where, { correo: 'ana@test.com' });
      return usuario;
    },
  });
  stubMethods(t, bcrypt.default ?? bcrypt, {
    compare: async () => true,
  });

  const resultado = await service.login({
    correo: ' ANA@Test.COM ',
    password: 'secreto',
  });

  assert.equal(resultado.user.password_hash, undefined);
  assert.equal(resultado.expires_in, 43200);
  assert.equal(verifyAuthToken(resultado.token).sub, 1);
});

test('auth login rechaza usuario inexistente o contraseña incorrecta con mensaje genérico', async (t) => {
  const bcrypt = await import('bcrypt');
  const service = await import('../../src/services/auth.service.js');
  const { default: Usuario } = await import('../../src/models/Usuario.js');

  stubMethods(t, Usuario, {
    findOne: async () => null,
  });

  await assert.rejects(
    () => service.login({ correo: 'nadie@test.com', password: 'x' }),
    /Correo o contraseña incorrectos/,
  );

  Usuario.findOne = async () => modelInstance({ estado: true, password_hash: 'hash' });
  stubMethods(t, bcrypt.default ?? bcrypt, {
    compare: async () => false,
  });

  await assert.rejects(
    () => service.login({ correo: 'ana@test.com', password: 'mal' }),
    /Correo o contraseña incorrectos/,
  );
});

test('python.service valida contrato de ruta y traduce indisponibilidad sin llamar a OSRM', async (t) => {
  const axios = await import('axios');
  const originalCreate = axios.default.create;
  const post = mock.fn(async () => ({ data: respuestaRutaValida }));

  axios.default.create = () => ({ post });
  t.after(() => {
    axios.default.create = originalCreate;
  });

  const service = await import(`../../src/services/python.service.js?ok=${Date.now()}`);

  assert.deepEqual(await service.calcularRuta(solicitudRutaValida), respuestaRutaValida);
  assert.equal(post.mock.calls[0].arguments[0], '/api/rutas/calcular');
  assert.deepEqual(post.mock.calls[0].arguments[1], solicitudRutaValida);
  assert.equal(typeof post.mock.calls[0].arguments[2].timeout, 'number');

  post.mock.mockImplementationOnce(async () => ({
    data: { ruta: [1], distancia_total: '8', tiempo_estimado: 12 },
  }));

  await assert.rejects(
    () => service.calcularRuta(solicitudRutaValida),
    /distancia inválida/,
  );

  post.mock.mockImplementationOnce(async () => {
    const error = new Error('connect ECONNREFUSED');
    error.code = 'ECONNREFUSED';
    throw error;
  });

  await assert.rejects(
    () => service.calcularRuta(solicitudRutaValida),
    /no fue posible comunicarse/,
  );
});

test('python.service distingue timeout y errores estructurados HTTP de Python', async (t) => {
  const axios = await import('axios');
  const originalCreate = axios.default.create;
  const post = mock.fn();

  axios.default.create = () => ({ post });
  t.after(() => {
    axios.default.create = originalCreate;
  });

  const service = await import(`../../src/services/python.service.js?errors=${Date.now()}`);

  post.mock.mockImplementationOnce(async () => {
    const error = new Error('timeout of 10ms exceeded');
    error.code = 'ECONNABORTED';
    throw error;
  });

  await assert.rejects(
    () => service.generarJornadaMetaheuristica(solicitudJornadaValida),
    /timeout del servicio Python/,
  );

  post.mock.mockImplementationOnce(async () => {
    const error = new Error('Request failed with status code 422');
    error.response = {
      status: 422,
      data: {
        error: {
          code: 'INVALID_INPUT',
          message: 'Payload invalido',
        },
      },
    };
    throw error;
  });

  await assert.rejects(
    () => service.generarJornadaMetaheuristica(solicitudJornadaValida),
    /INVALID_INPUT - Payload invalido/,
  );

  post.mock.mockImplementationOnce(async () => {
    const error = new Error('Request failed with status code 500');
    error.response = {
      status: 500,
      data: {
        error: {
          code: 'INVALID_RESULT',
          message: 'Resultado invalido',
        },
      },
    };
    throw error;
  });

  await assert.rejects(
    () => service.generarJornadaMetaheuristica(solicitudJornadaValida),
    /INVALID_RESULT - Resultado invalido/,
  );
});

test('python.service rechaza jornadas inválidas antes de persistencia', async (t) => {
  const axios = await import('axios');
  const originalCreate = axios.default.create;
  const post = mock.fn();

  axios.default.create = () => ({ post });
  t.after(() => {
    axios.default.create = originalCreate;
  });

  const service = await import(`../../src/services/python.service.js?validation=${Date.now()}`);

  const casos = [
    [
      'sin camión',
      {
        ...structuredClone(respuestaJornadaValida),
        jornadas: [
          {
            ...structuredClone(respuestaJornadaValida.jornadas[0]),
            camion_id: undefined,
          },
        ],
      },
      /camión desconocido/,
    ],
    [
      'camión duplicado',
      {
        ...structuredClone(respuestaJornadaValida),
        jornadas: [
          structuredClone(respuestaJornadaValida.jornadas[0]),
          structuredClone(respuestaJornadaValida.jornadas[0]),
        ],
      },
      /camión duplicado/,
    ],
    [
      'pedido desconocido',
      {
        ...structuredClone(respuestaJornadaValida),
        jornadas: [
          {
            ...structuredClone(respuestaJornadaValida.jornadas[0]),
            entregas: [
              {
                ...structuredClone(respuestaJornadaValida.jornadas[0].entregas[0]),
                pedido_id: 999,
              },
            ],
          },
        ],
      },
      /pedido desconocido/,
    ],
    [
      'pedido omitido',
      {
        jornadas: [],
        pedidos_no_asignados: [],
      },
      /omitió/,
    ],
    [
      'asignado y no asignado',
      {
        ...structuredClone(respuestaJornadaValida),
        pedidos_no_asignados: [100],
      },
      /asignado y no asignado/,
    ],
    [
      'distancia NaN',
      {
        ...structuredClone(respuestaJornadaValida),
        jornadas: [
          {
            ...structuredClone(respuestaJornadaValida.jornadas[0]),
            distancia_total_km: Number.NaN,
          },
        ],
      },
      /distancia total/,
    ],
    [
      'tiempo infinito',
      {
        ...structuredClone(respuestaJornadaValida),
        jornadas: [
          {
            ...structuredClone(respuestaJornadaValida.jornadas[0]),
            tiempo_estimado_min: Number.POSITIVE_INFINITY,
          },
        ],
      },
      /tiempo estimado/,
    ],
    [
      'geometría inválida',
      {
        ...structuredClone(respuestaJornadaValida),
        jornadas: [
          {
            ...structuredClone(respuestaJornadaValida.jornadas[0]),
            ruta_general: {
              ...structuredClone(respuestaJornadaValida.jornadas[0].ruta_general),
              geometria: [[-2.1]],
            },
          },
        ],
      },
      /geometría general/,
    ],
    [
      'sin retorno',
      {
        ...structuredClone(respuestaJornadaValida),
        jornadas: [
          {
            ...structuredClone(respuestaJornadaValida.jornadas[0]),
            ruta_general: {
              ...structuredClone(respuestaJornadaValida.jornadas[0].ruta_general),
              tramos: [],
            },
          },
        ],
      },
      /retorna a bodega/,
    ],
    [
      'capacidad excedida',
      {
        ...structuredClone(respuestaJornadaValida),
        jornadas: [
          {
            ...structuredClone(respuestaJornadaValida.jornadas[0]),
            entregas: [
              ...structuredClone(respuestaJornadaValida.jornadas[0].entregas),
              {
                ...structuredClone(respuestaJornadaValida.jornadas[0].entregas[0]),
                pedido_id: 101,
              },
              {
                ...structuredClone(respuestaJornadaValida.jornadas[0].entregas[0]),
                pedido_id: 102,
              },
            ],
          },
        ],
      },
      /excede la capacidad/,
    ],
  ];

  for (const [_nombre, data, expected] of casos) {
    post.mock.mockImplementationOnce(async () => ({ data }));

    await assert.rejects(
      () => service.generarJornadaMetaheuristica({
        ...solicitudJornadaValida,
        pedidos: [
          ...solicitudJornadaValida.pedidos,
          {
            ...solicitudJornadaValida.pedidos[0],
            pedido_id: 101,
          },
          {
            ...solicitudJornadaValida.pedidos[0],
            pedido_id: 102,
          },
        ],
      }),
      expected,
    );
  }
});

test('python.service acepta resultado de jornada válido y clasifica todos los pedidos', async (t) => {
  const axios = await import('axios');
  const originalCreate = axios.default.create;
  const post = mock.fn(async () => ({ data: respuestaJornadaValida }));

  axios.default.create = () => ({ post });
  t.after(() => {
    axios.default.create = originalCreate;
  });

  const service = await import(`../../src/services/python.service.js?valid=${Date.now()}`);

  assert.deepEqual(
    await service.generarJornadaMetaheuristica(solicitudJornadaValida),
    respuestaJornadaValida,
  );
});

test('n8n service envia contratos normalizados al webhook publicado', async (t) => {
  const axios = await import('axios');
  const service = await import('../../src/services/n8n.service.js');
  const originalPost = axios.default.post;
  const originalEnabled = process.env.N8N_ENABLED;
  const originalUrl = process.env.N8N_WEBHOOK_URL;
  const post = mock.fn(async () => ({ status: 200 }));

  axios.default.post = post;
  process.env.N8N_ENABLED = 'true';
  process.env.N8N_WEBHOOK_URL =
    'http://n8n.test/webhook/techsupply-notificaciones';

  t.after(() => {
    axios.default.post = originalPost;
    process.env.N8N_ENABLED = originalEnabled;
    process.env.N8N_WEBHOOK_URL = originalUrl;
  });

  await service.despachoEntregado({
    id: 2,
    pedido_id: 41,
    estado: 'ENTREGADO',
    pedido: {
      id: 41,
      cliente: {
        id: 8,
        nombre: 'Cliente Demo',
        correo: 'cliente8@demo.com',
      },
    },
  });

  assert.equal(post.mock.calls.length, 1);
  assert.equal(
    post.mock.calls[0].arguments[0],
    'http://n8n.test/webhook/techsupply-notificaciones',
  );

  const payload = post.mock.calls[0].arguments[1];

  assert.equal(payload.evento, 'DESPACHO_ENTREGADO');
  assert.equal(payload.modo_demo, true);
  assert.equal(
    payload.datos.despacho.pedido.codigo,
    'PED-00041',
  );
  assert.equal(
    payload.datos.despacho.pedido.cliente.correo,
    'cliente8@demo.com',
  );
  assert.equal(
    post.mock.calls[0].arguments[2].timeout,
    3000,
  );
});

test('n8n service conserva jornada, despachos y correos de cliente en eventos operativos', async (t) => {
  const axios = await import('axios');
  const service = await import('../../src/services/n8n.service.js');
  const originalPost = axios.default.post;
  const originalEnabled = process.env.N8N_ENABLED;
  const post = mock.fn(async () => ({ status: 200 }));
  const jornada = {
    id: 7,
    camion_id: 3,
    chofer_id: 5,
    estado: 'EN_RUTA',
    camion: {
      id: 3,
      codigo: 'CAM-003',
      placa: 'MAB-2003',
    },
    despachos: [
      {
        id: 20,
        pedido_id: 30,
        orden_entrega: 1,
        estado: 'EN_TRANSITO',
        pedido: {
          id: 30,
          cliente: {
            id: 9,
            nombre: 'Cliente Costa',
            correo: 'costa@demo.techsupply.ec',
          },
        },
      },
    ],
  };

  axios.default.post = post;
  process.env.N8N_ENABLED = 'true';

  t.after(() => {
    axios.default.post = originalPost;
    process.env.N8N_ENABLED = originalEnabled;
  });

  await service.jornadaIniciada(jornada);
  await service.despachoNoEntregado({
    ...jornada.despachos[0],
    estado: 'NO_ENTREGADO',
  });
  await service.jornadaFinalizada({
    ...jornada,
    estado: 'FINALIZADA',
    despachos: [
      {
        ...jornada.despachos[0],
        estado: 'NO_ENTREGADO',
      },
    ],
  });

  assert.deepEqual(
    post.mock.calls.map((call) => call.arguments[1].evento),
    [
      'JORNADA_INICIADA',
      'DESPACHO_NO_ENTREGADO',
      'JORNADA_FINALIZADA',
    ],
  );

  const inicio = post.mock.calls[0].arguments[1].datos;

  assert.equal(inicio.jornada.codigo, 'JR-00007');
  assert.equal(inicio.jornada.camion.codigo, 'CAM-003');
  assert.equal(inicio.jornada.nombre_chofer, 'Chofer #5');
  assert.equal(
    inicio.despachos[0].pedido.cliente.correo,
    'costa@demo.techsupply.ec',
  );

  const finalizacion = post.mock.calls[2].arguments[1].datos;

  assert.equal(finalizacion.despachos[0].estado, 'NO_ENTREGADO');
});

test('n8n service agrupa jornadas creadas en un unico resumen administrativo', async (t) => {
  const axios = await import('axios');
  const service = await import('../../src/services/n8n.service.js');
  const originalPost = axios.default.post;
  const originalEnabled = process.env.N8N_ENABLED;
  const post = mock.fn(async () => ({ status: 200 }));

  axios.default.post = post;
  process.env.N8N_ENABLED = 'true';

  t.after(async () => {
    await service.flushJornadasCreadasPendientes();
    axios.default.post = originalPost;
    process.env.N8N_ENABLED = originalEnabled;
  });

  await service.jornadaCreada(
    {
      id: 10,
      camion_id: 3,
      distancia_total: 120.5,
      tiempo_estimado: 180,
    },
    [
      { pedido_id: 1, orden_entrega: 1 },
      { pedido_id: 2, orden_entrega: 1 },
    ],
  );

  await service.jornadaCreada(
    {
      id: 11,
      camion_id: 4,
      distancia_total: 98.25,
      tiempo_estimado: 145,
    },
    [
      { pedido_id: 3, orden_entrega: 1 },
      { pedido_id: 4, orden_entrega: 2 },
      { pedido_id: 5, orden_entrega: 3 },
    ],
  );

  assert.equal(post.mock.calls.length, 0);

  await service.flushJornadasCreadasPendientes();

  assert.equal(post.mock.calls.length, 1);

  const payload = post.mock.calls[0].arguments[1];

  assert.equal(payload.evento, 'JORNADA_CREADA');
  assert.equal(payload.datos.resumen.total_jornadas, 2);
  assert.equal(payload.datos.resumen.pedidos_asignados, 5);
  assert.equal(payload.datos.jornadas[0].total_puntos, 1);
  assert.equal(payload.datos.jornadas[1].total_puntos, 3);
});

test('n8n service puede deshabilitarse sin intentar conexiones externas', async (t) => {
  const axios = await import('axios');
  const service = await import('../../src/services/n8n.service.js');
  const originalPost = axios.default.post;
  const originalEnabled = process.env.N8N_ENABLED;
  const post = mock.fn();

  axios.default.post = post;
  process.env.N8N_ENABLED = 'false';

  t.after(() => {
    axios.default.post = originalPost;
    process.env.N8N_ENABLED = originalEnabled;
  });

  const resultado = await service.jornadaFinalizada({ id: 3 });

  assert.equal(resultado.omitido, true);
  assert.equal(resultado.motivo, 'N8N_DISABLED');
  assert.equal(post.mock.calls.length, 0);
});
