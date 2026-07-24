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
  'bodega.routes.js',
  'chofer.routes.js',
];

const readFiles = (directory, extensions) => {
  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  return entries.flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return readFiles(fullPath, extensions);
    }

    return extensions.includes(path.extname(entry.name))
      ? [fullPath]
      : [];
  });
};

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
    bodega: await import('../../src/routes/bodega.routes.js'),
    choferes: await import('../../src/routes/chofer.routes.js'),
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
    [['get'], '/mis-jornadas'],
    [['get'], '/:id'],
    [['post'], '/generar'],
    [['patch'], '/:id/recalcular'],
    [['patch'], '/:id/asignar-chofer'],
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
    [['post'], '/'],
    [['put'], '/:id'],
    [['delete'], '/:id'],
  ]);

  assert.deepEqual(actual.bodega.map((route) => [route.methods, route.path]), [
    [['get'], '/pedidos'],
    [['get'], '/pedidos/:id'],
    [['patch'], '/detalles/:id/preparacion'],
    [['patch'], '/pedidos/:id/finalizar-preparacion'],
    [['get'], '/jornadas'],
    [['get'], '/jornadas/:id/carga'],
    [['patch'], '/despachos/:id/carga'],
    [['patch'], '/jornadas/:id/confirmar-carga'],
  ]);

  assert.deepEqual(actual.choferes.map((route) => [route.methods, route.path]), [
    [['get'], '/'],
    [['get'], '/disponibles'],
    [['post'], '/'],
    [['get'], '/:id'],
    [['put'], '/:id'],
    [['delete'], '/:id'],
  ]);
});

test('rutas operativas activas declaran autenticación antes de autorización', () => {
  const operationalRouteFiles = activeRouteFiles.filter(
    (file) => file !== 'auth.routes.js',
  );

  for (const file of operationalRouteFiles) {
    const source = fs.readFileSync(
      path.join(
        process.cwd(),
        'src',
        'routes',
        file,
      ),
      'utf8',
    );

    assert.match(
      source,
      /import\s+\*\s+as\s+authMiddleware\s+from\s+['"]\.\.\/middlewares\/auth\.middleware\.js['"]/,
      file,
    );
    assert.match(
      source,
      /router\.use\(\s*authMiddleware\.requireAuth,\s*\);/,
      file,
    );

    const authIndex = source.indexOf(
      'router.use(\n  authMiddleware.requireAuth',
    );
    const authorizationIndex = source.indexOf(
      'authorizationMiddleware.requirePermission',
    );

    assert.ok(
      authIndex >= 0 &&
        authorizationIndex > authIndex,
      `${file} debe autenticar antes de autorizar`,
    );
  }
});

test('asociaciones Sequelize declaran aliases canónicos explícitos', async () => {
  const { default: db } = await import('../../src/models/index.js');

  const expected = [
    ['Categoria', 'HasMany', 'Producto', 'categoria_id', 'productos'],
    ['Producto', 'BelongsTo', 'Categoria', 'categoria_id', 'categoria'],
    ['Ubicacion', 'HasMany', 'Cliente', 'ubicacion_id', 'clientes'],
    ['Cliente', 'BelongsTo', 'Ubicacion', 'ubicacion_id', 'ubicacion'],
    ['Ubicacion', 'HasMany', 'Ruta', 'origen_id', 'rutasOrigen'],
    ['Ubicacion', 'HasMany', 'Ruta', 'destino_id', 'rutasDestino'],
    ['Ruta', 'BelongsTo', 'Ubicacion', 'origen_id', 'origen'],
    ['Ruta', 'BelongsTo', 'Ubicacion', 'destino_id', 'destino'],
    ['Cliente', 'HasMany', 'Pedido', 'cliente_id', 'pedidos'],
    ['Pedido', 'BelongsTo', 'Cliente', 'cliente_id', 'cliente'],
    ['Usuario', 'HasMany', 'Pedido', 'usuario_id', 'pedidos'],
    ['Pedido', 'BelongsTo', 'Usuario', 'usuario_id', 'usuario'],
    ['Pedido', 'HasMany', 'DetallePedido', 'pedido_id', 'detalles'],
    ['DetallePedido', 'BelongsTo', 'Pedido', 'pedido_id', 'pedido'],
    ['Producto', 'HasMany', 'DetallePedido', 'producto_id', 'detallesPedido'],
    ['DetallePedido', 'BelongsTo', 'Producto', 'producto_id', 'producto'],
    ['Pedido', 'HasMany', 'Despacho', 'pedido_id', 'despachos'],
    ['Despacho', 'BelongsTo', 'Pedido', 'pedido_id', 'pedido'],
    ['Proveedor', 'HasMany', 'OrdenCompra', 'proveedor_id', 'ordenesCompra'],
    ['OrdenCompra', 'BelongsTo', 'Proveedor', 'proveedor_id', 'proveedor'],
    ['Usuario', 'HasMany', 'OrdenCompra', 'usuario_id', 'ordenesCompra'],
    ['OrdenCompra', 'BelongsTo', 'Usuario', 'usuario_id', 'usuario'],
    ['OrdenCompra', 'HasMany', 'DetalleOrdenCompra', 'orden_compra_id', 'detalles'],
    ['DetalleOrdenCompra', 'BelongsTo', 'OrdenCompra', 'orden_compra_id', 'ordenCompra'],
    ['Producto', 'HasMany', 'DetalleOrdenCompra', 'producto_id', 'detallesOrdenCompra'],
    ['DetalleOrdenCompra', 'BelongsTo', 'Producto', 'producto_id', 'producto'],
    ['OrdenCompra', 'HasMany', 'IngresoInventario', 'orden_compra_id', 'ingresosInventario'],
    ['IngresoInventario', 'BelongsTo', 'OrdenCompra', 'orden_compra_id', 'ordenCompra'],
    ['Usuario', 'HasMany', 'IngresoInventario', 'usuario_id', 'ingresosInventario'],
    ['IngresoInventario', 'BelongsTo', 'Usuario', 'usuario_id', 'usuario'],
    ['IngresoInventario', 'HasMany', 'DetalleIngreso', 'ingreso_inventario_id', 'detalles'],
    ['DetalleIngreso', 'BelongsTo', 'IngresoInventario', 'ingreso_inventario_id', 'ingresoInventario'],
    ['Producto', 'HasMany', 'DetalleIngreso', 'producto_id', 'detallesIngreso'],
    ['DetalleIngreso', 'BelongsTo', 'Producto', 'producto_id', 'producto'],
    ['Camion', 'HasMany', 'JornadaReparto', 'camion_id', 'jornadas'],
    ['JornadaReparto', 'BelongsTo', 'Camion', 'camion_id', 'camion'],
    ['Usuario', 'HasOne', 'Chofer', 'usuario_id', 'chofer'],
    ['Chofer', 'BelongsTo', 'Usuario', 'usuario_id', 'usuario'],
    ['Chofer', 'HasMany', 'JornadaReparto', 'chofer_id', 'jornadas'],
    ['JornadaReparto', 'BelongsTo', 'Chofer', 'chofer_id', 'chofer'],
    ['Usuario', 'HasMany', 'Pedido', 'creado_por_usuario_id', 'pedidosCreados'],
    ['Pedido', 'BelongsTo', 'Usuario', 'creado_por_usuario_id', 'creadoPor'],
    ['Usuario', 'HasMany', 'Pedido', 'enviado_preparacion_por_usuario_id', 'pedidosEnviadosPreparacion'],
    ['Pedido', 'BelongsTo', 'Usuario', 'enviado_preparacion_por_usuario_id', 'enviadoPreparacionPor'],
    ['Usuario', 'HasMany', 'Pedido', 'preparacion_finalizada_por_usuario_id', 'pedidosPreparacionFinalizada'],
    ['Pedido', 'BelongsTo', 'Usuario', 'preparacion_finalizada_por_usuario_id', 'preparacionFinalizadaPor'],
    ['Usuario', 'HasMany', 'DetallePedido', 'preparado_por_usuario_id', 'detallesPreparados'],
    ['DetallePedido', 'BelongsTo', 'Usuario', 'preparado_por_usuario_id', 'preparadoPor'],
    ['Usuario', 'HasMany', 'Despacho', 'cargado_por_usuario_id', 'despachosCargados'],
    ['Despacho', 'BelongsTo', 'Usuario', 'cargado_por_usuario_id', 'cargadoPor'],
    ['Usuario', 'HasMany', 'JornadaReparto', 'carga_confirmada_por_usuario_id', 'cargasConfirmadas'],
    ['JornadaReparto', 'BelongsTo', 'Usuario', 'carga_confirmada_por_usuario_id', 'cargaConfirmadaPor'],
    ['JornadaReparto', 'HasMany', 'Despacho', 'jornada_reparto_id', 'despachos'],
    ['Despacho', 'BelongsTo', 'JornadaReparto', 'jornada_reparto_id', 'jornada'],
  ];

  const totalAssociations = Object.values(db)
    .filter((model) => model?.associations)
    .reduce(
      (total, model) =>
        total + Object.keys(model.associations).length,
      0,
    );

  assert.equal(totalAssociations, expected.length);

  for (const [
    source,
    type,
    target,
    foreignKey,
    alias,
  ] of expected) {
    const association = db[source].associations[alias];

    assert.ok(
      association,
      `${source}.${alias} debe existir`,
    );
    assert.equal(association.as, alias);
    assert.equal(association.associationType, type);
    assert.equal(association.target.name, target);
    assert.equal(association.foreignKey, foreignKey);
    assert.match(alias, /^[a-z][A-Za-z0-9]*$/);
  }

  for (const [source, model] of Object.entries(db)) {
    if (!model?.associations) continue;

    const aliases = Object.values(model.associations).map(
      (association) => association.as,
    );

    assert.equal(
      aliases.length,
      new Set(aliases).size,
      `${source} no debe repetir aliases`,
    );
  }

  assert.notEqual(
    db.Ubicacion.associations.rutasOrigen.as,
    db.Ubicacion.associations.rutasDestino.as,
  );
});

test('aliases respetan singular/plural según cardinalidad', async () => {
  const { default: db } = await import('../../src/models/index.js');
  const singularAliases = new Set([
    'categoria',
    'ubicacion',
    'origen',
    'destino',
    'cliente',
    'usuario',
    'pedido',
    'producto',
    'jornada',
    'camion',
    'proveedor',
    'ordenCompra',
    'ingresoInventario',
    'chofer',
    'creadoPor',
    'enviadoPreparacionPor',
    'preparacionFinalizadaPor',
    'preparadoPor',
    'cargadoPor',
    'cargaConfirmadaPor',
  ]);
  const collectionAliases = new Set([
    'productos',
    'clientes',
    'rutasOrigen',
    'rutasDestino',
    'pedidos',
    'detalles',
    'detallesPedido',
    'despachos',
    'ordenesCompra',
    'detallesOrdenCompra',
    'ingresosInventario',
    'detallesIngreso',
    'jornadas',
    'pedidosCreados',
    'pedidosEnviadosPreparacion',
    'pedidosPreparacionFinalizada',
    'detallesPreparados',
    'despachosCargados',
    'cargasConfirmadas',
  ]);

  for (const model of Object.values(db)) {
    if (!model?.associations) continue;

    for (const association of Object.values(model.associations)) {
      if (association.associationType === 'BelongsTo') {
        assert.ok(
          singularAliases.has(association.as),
          `${association.as} debe ser singular`,
        );
      }

      if (association.associationType === 'HasMany') {
        assert.ok(
          collectionAliases.has(association.as),
          `${association.as} debe representar colección`,
        );
      }
    }
  }
});

test('includes activos usan as y consumidores no usan relaciones PascalCase', () => {
  const sourceFiles = [
    ...readFiles(
      path.join(process.cwd(), 'src', 'services'),
      ['.js'],
    ),
    ...readFiles(
      path.join(process.cwd(), 'frontend', 'src'),
      ['.js', '.jsx'],
    ),
  ];

  const includeWithoutAlias =
    /model:\s+(Cliente|Usuario|Categoria|Producto|Ubicacion|Pedido|DetallePedido|Despacho|Camion|JornadaReparto),[^\S\r\n]*\r?\n(?![^\S\r\n]*as:)/;

  const pascalRelationAccess =
    /\.(Cliente|Usuario|Categoria|Producto|Ubicacion|Pedido|DetallePedido|Despacho|Camion|JornadaReparto)\b|\[['"](Cliente|Pedido|Ubicacion|Producto|Usuario)['"]\]/;

  for (const file of sourceFiles) {
    const source = fs.readFileSync(file, 'utf8');

    assert.doesNotMatch(
      source,
      includeWithoutAlias,
      file,
    );

    assert.doesNotMatch(
      source,
      pascalRelationAccess,
      file,
    );
  }
});
