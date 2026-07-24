import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import './helpers/testEnv.js';

const activeRouteFiles = [
  'auth.routes.js',
  'usuario.routes.js',
  'cliente.routes.js',
  'categoria.routes.js',
  'producto.routes.js',
  'ubicacion.routes.js',
  'ruta.routes.js',
  'pedido.routes.js',
  'detallePedido.routes.js',
  'despacho.routes.js',
  'jornadaReparto.routes.js',
  'camion.routes.js',
];

function getRoutes(router) {
  return router.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods).sort(),
      handlers: layer.route.stack.length,
    }));
}

test('rutas activas importan controladores mediante namespace', () => {
  for (const file of activeRouteFiles) {
    const source = fs.readFileSync(
      path.join(
        process.cwd(),
        'src',
        'routes',
        file,
      ),
      'utf8',
    );

    assert.doesNotMatch(
      source,
      /import\s*\{[\s\S]*?\}\s*from\s*['"]\.\.\/controllers\//,
      file,
    );

    assert.match(
      source,
      /import\s+\*\s+as\s+\w+Controller\s+from\s+['"]\.\.\/controllers\/[\w]+\.controller\.js['"]/,
      file,
    );
  }
});

test('rutas Express activas conservan método, URL y orden observable', async () => {
  const modules = {
    auth: await import('../../src/routes/auth.routes.js'),
    usuarios: await import('../../src/routes/usuario.routes.js'),
    clientes: await import('../../src/routes/cliente.routes.js'),
    categorias: await import('../../src/routes/categoria.routes.js'),
    productos: await import('../../src/routes/producto.routes.js'),
    ubicaciones: await import('../../src/routes/ubicacion.routes.js'),
    rutas: await import('../../src/routes/ruta.routes.js'),
    pedidos: await import('../../src/routes/pedido.routes.js'),
    detallesPedido: await import('../../src/routes/detallePedido.routes.js'),
    despachos: await import('../../src/routes/despacho.routes.js'),
    jornadas: await import('../../src/routes/jornadaReparto.routes.js'),
    camiones: await import('../../src/routes/camion.routes.js'),
  };

  const actual = Object.fromEntries(
    Object.entries(modules).map(([name, module]) => [
      name,
      getRoutes(module.default),
    ]),
  );

  assert.deepEqual(actual.auth.map((route) => [route.methods, route.path]), [
    [['post'], '/login'],
    [['get'], '/me'],
  ]);
  assert.equal(actual.auth.find((route) => route.path === '/me').handlers, 2);

  for (const name of [
    'usuarios',
    'clientes',
    'categorias',
    'productos',
    'ubicaciones',
    'rutas',
    'detallesPedido',
  ]) {
    assert.deepEqual(actual[name].map((route) => [route.methods, route.path]), [
      [['get'], '/'],
      [['get'], '/:id'],
      [['post'], '/'],
      [['put'], '/:id'],
      [['delete'], '/:id'],
    ], name);
  }

  assert.deepEqual(actual.pedidos.map((route) => [route.methods, route.path]), [
    [['get'], '/'],
    [['get'], '/:id'],
    [['post'], '/'],
    [['put'], '/:id'],
    [['delete'], '/:id'],
    [['patch'], '/:id/preparar'],
    [['patch'], '/:id/finalizar-preparacion'],
    [['patch'], '/:id/cancelar'],
  ]);

  assert.deepEqual(actual.jornadas.map((route) => [route.methods, route.path]), [
    [['get'], '/'],
    [['get'], '/mapa-general'],
    [['get'], '/:id'],
    [['post'], '/generar'],
    [['patch'], '/:id/recalcular'],
    [['patch'], '/:id/iniciar'],
    [['patch'], '/:id/avanzar'],
    [['patch'], '/:id/finalizar'],
  ]);

  assert.deepEqual(actual.despachos.map((route) => [route.methods, route.path]), [
    [['get'], '/'],
    [['get'], '/pedidos-disponibles'],
    [['get'], '/:id'],
    [['post'], '/'],
    [['patch'], '/:id/iniciar'],
    [['patch'], '/:id/entregar'],
    [['patch'], '/:id/no-entregado'],
    [['patch'], '/:id/cancelar'],
  ]);

  assert.deepEqual(actual.camiones.map((route) => [route.methods, route.path]), [
    [['get'], '/'],
    [['get'], '/:id'],
  ]);
});

test('asociaciones Sequelize usadas por includes conservan aliases actuales', async () => {
  const { default: db } = await import('../../src/models/index.js');

  assert.equal(db.Ubicacion.associations.rutasOrigen.as, 'rutasOrigen');
  assert.equal(db.Ubicacion.associations.rutasDestino.as, 'rutasDestino');
  assert.equal(db.Ruta.associations.origen.as, 'origen');
  assert.equal(db.Ruta.associations.destino.as, 'destino');
  assert.equal(db.Camion.associations.jornadas.as, 'jornadas');
  assert.equal(db.JornadaReparto.associations.camion.as, 'camion');
  assert.equal(db.JornadaReparto.associations.despachos.as, 'despachos');
  assert.equal(db.Despacho.associations.jornada.as, 'jornada');

  assert.equal(db.Pedido.associations.Cliente.as, 'Cliente');
  assert.equal(db.Pedido.associations.Usuario.as, 'Usuario');
  assert.equal(db.DetallePedido.associations.Producto.as, 'Producto');
});
