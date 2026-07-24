import test, { mock } from 'node:test';
import assert from 'node:assert/strict';

import { modelInstance, stubMethods } from './helpers/testEnv.js';
import { respuestaRutaValida, solicitudRutaValida } from './fixtures/nodePythonContracts.js';

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
  assert.deepEqual(post.mock.calls[0].arguments, ['/api/rutas/calcular', solicitudRutaValida]);

  post.mock.mockImplementationOnce(async () => ({
    data: { ruta: [1], distancia_total: '8', tiempo_estimado: 12 },
  }));

  await assert.rejects(
    () => service.calcularRuta(solicitudRutaValida),
    /respuesta inválida/,
  );

  post.mock.mockImplementationOnce(async () => {
    const error = new Error('connect ECONNREFUSED');
    error.code = 'ECONNREFUSED';
    throw error;
  });

  await assert.rejects(
    () => service.calcularRuta(solicitudRutaValida),
    /No fue posible comunicarse/,
  );
});

test('n8n service permanece como stub local y no requiere webhook real', async () => {
  const service = await import('../../src/services/n8n.service.js');

  assert.equal(await service.jornadaCreada({ id: 1 }, []), undefined);
  assert.equal(await service.despachoEntregado({ id: 2 }), undefined);
  assert.equal(await service.jornadaFinalizada({ id: 3 }), undefined);
});
