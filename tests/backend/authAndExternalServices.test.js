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

test('n8n service permanece como stub local y no requiere webhook real', async () => {
  const service = await import('../../src/services/n8n.service.js');

  assert.equal(await service.jornadaCreada({ id: 1 }, []), undefined);
  assert.equal(await service.despachoEntregado({ id: 2 }), undefined);
  assert.equal(await service.jornadaFinalizada({ id: 3 }), undefined);
});
