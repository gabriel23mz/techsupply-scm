import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import {
  stubMethods,
} from './helpers/testEnv.js';

const encode = (value) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

const signPayload = (payload) =>
  crypto
    .createHmac(
      'sha256',
      process.env.AUTH_SECRET,
    )
    .update(payload)
    .digest('base64url');

const tokenFor = (payload) => {
  const encoded = encode(payload);

  return `${encoded}.${signPayload(encoded)}`;
};

const runMiddleware = async (middleware, req) => {
  let receivedError = null;
  let nextCalled = false;

  await middleware(req, {}, (error) => {
    receivedError = error ?? null;
    nextCalled = !error;
  });

  return {
    error: receivedError,
    nextCalled,
  };
};

test('requireAuth diferencia token ausente, inválido, expirado y usuario no disponible', async (t) => {
  const { requireAuth } = await import('../../src/middlewares/auth.middleware.js');
  const { default: Usuario } = await import('../../src/models/Usuario.js');

  stubMethods(t, Usuario, {
    findOne: async () => null,
  });

  const missing = await runMiddleware(
    requireAuth,
    { headers: {} },
  );

  assert.equal(missing.error.statusCode, 401);
  assert.equal(missing.error.code, 'AUTH_REQUERIDA');

  const invalid = await runMiddleware(
    requireAuth,
    {
      headers: {
        authorization: 'Bearer token.invalido',
      },
    },
  );

  assert.equal(invalid.error.statusCode, 401);
  assert.equal(invalid.error.code, 'TOKEN_INVALIDO');

  const expired = await runMiddleware(
    requireAuth,
    {
      headers: {
        authorization: `Bearer ${tokenFor({
          sub: 99,
          rol: 'VENTAS',
          iat: 1,
          exp: 1,
        })}`,
      },
    },
  );

  assert.equal(expired.error.statusCode, 401);
  assert.equal(expired.error.code, 'TOKEN_EXPIRADO');

  const unavailable = await runMiddleware(
    requireAuth,
    {
      headers: {
        authorization: `Bearer ${tokenFor({
          sub: 99,
          rol: 'VENTAS',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 60,
        })}`,
      },
    },
  );

  assert.equal(unavailable.error.statusCode, 401);
  assert.equal(unavailable.error.code, 'USUARIO_SESION_INVALIDO');
});

test('requireAuth usa el rol vigente de base de datos y excluye password_hash', async (t) => {
  const { requireAuth } = await import('../../src/middlewares/auth.middleware.js');
  const { default: Usuario } = await import('../../src/models/Usuario.js');

  stubMethods(t, Usuario, {
    findOne: async () => ({
      id: 7,
      nombre: 'Bodega',
      rol: 'BODEGA',
      estado: true,
      toJSON: () => ({
        id: 7,
        nombre: 'Bodega',
        rol: 'BODEGA',
        estado: true,
      }),
    }),
  });

  const req = {
    headers: {
      authorization: `Bearer ${tokenFor({
        sub: 7,
        rol: 'VENTAS',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60,
      })}`,
    },
  };

  const result = await runMiddleware(
    requireAuth,
    req,
  );

  assert.equal(result.nextCalled, true);
  assert.equal(req.auth.rol, 'BODEGA');
  assert.equal(req.user.rol, 'BODEGA');
  assert.equal(req.user.password_hash, undefined);
});

test('requirePermission responde 401 sin usuario, 403 sin permiso y permite ADMIN total', async () => {
  const authorizationMiddleware =
    await import('../../src/middlewares/authorization.middleware.js');
  const { PERMISSIONS } =
    await import('../../src/constants/permissions.js');

  const requirePedidosCrear =
    authorizationMiddleware.requirePermission(
      PERMISSIONS.PEDIDOS_CREAR,
    );

  const missing = await runMiddleware(
    requirePedidosCrear,
    {},
  );

  assert.equal(missing.error.statusCode, 401);

  const forbidden = await runMiddleware(
    requirePedidosCrear,
    {
      user: {
        id: 1,
        rol: 'COMPRAS',
      },
    },
  );

  assert.equal(forbidden.error.statusCode, 403);
  assert.equal(forbidden.error.code, 'PERMISO_DENEGADO');

  const admin = await runMiddleware(
    requirePedidosCrear,
    {
      user: {
        id: 2,
        rol: 'ADMIN',
      },
    },
  );

  assert.equal(admin.nextCalled, true);
});

test('matriz de permisos mantiene permisos principales por rol', async () => {
  const {
    PERMISSIONS,
    ROLE_PERMISSIONS,
    getPermissionsForRole,
  } = await import('../../src/constants/permissions.js');

  assert.ok(
    getPermissionsForRole('ADMIN').includes(
      PERMISSIONS.CARGAS_CONFIRMAR,
    ),
  );
  assert.ok(
    ROLE_PERMISSIONS.VENTAS.includes(
      PERMISSIONS.PEDIDOS_ENVIAR_PREPARACION,
    ),
  );
  assert.ok(
    ROLE_PERMISSIONS.BODEGA.includes(
      PERMISSIONS.CARGAS_CONFIRMAR,
    ),
  );
  assert.ok(
    ROLE_PERMISSIONS.LOGISTICA.includes(
      PERMISSIONS.JORNADAS_ASIGNAR_CHOFER,
    ),
  );
  assert.ok(
    ROLE_PERMISSIONS.CHOFER.includes(
      PERMISSIONS.DESPACHOS_ENTREGAR,
    ),
  );
  assert.ok(
    ROLE_PERMISSIONS.COMPRAS.includes(
      PERMISSIONS.CATALOGO_GESTIONAR,
    ),
  );
});
