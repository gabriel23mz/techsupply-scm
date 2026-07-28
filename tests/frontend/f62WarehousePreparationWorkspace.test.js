import assert from 'node:assert/strict';
import {
  readFile,
} from 'node:fs/promises';
import test from 'node:test';

import {
  replaceWarehouseDetail,
  validatePreparedQuantity,
} from '../../frontend/src/modules/bodega/bodega.utils.js';

const projectRoot = new URL('../../', import.meta.url);

const readSource = (relativePath) =>
  readFile(new URL(relativePath, projectRoot), 'utf8');

test('F6.2 registra el Workspace de preparación como ruta protegida y oculta', async () => {
  const routes = await readSource(
    'frontend/src/shared/routing/routeRegistry.jsx',
  );
  const components = await readSource(
    'frontend/src/shared/routing/routeComponents.jsx',
  );

  assert.match(routes, /id: 'bodega-preparacion-workspace'/);
  assert.match(routes, /path: '\/bodega\/preparacion\/:id'/);
  assert.match(routes, /PERMISSIONS\.PEDIDOS_PREPARAR/);
  assert.match(routes, /element: <BodegaPreparacionWorkspacePage \/>/);
  assert.match(routes, /hidden: true/);
  assert.match(
    components,
    /modules\/bodega\/pages\/PreparacionWorkspacePage/,
  );
});

test('F6.2 consume actualización por detalle y finalización con los contratos vigentes', async () => {
  const service = await readSource(
    'frontend/src/modules/bodega/services/bodega.service.js',
  );

  assert.match(
    service,
    /api\.patch\(\s*`\/bodega\/detalles\/\$\{id\}\/preparacion`/,
  );
  assert.match(service, /cantidad_preparada: cantidadPreparada/);
  assert.match(
    service,
    /api\.patch\(\s*`\/bodega\/pedidos\/\$\{id\}\/finalizar-preparacion`/,
  );
});

test('F6.2 usa WorkspaceShell, Topbar y confirmaciones compartidas', async () => {
  const page = await readSource(
    'frontend/src/modules/bodega/pages/PreparacionWorkspacePage.jsx',
  );

  assert.match(page, /WorkspaceShell/);
  assert.match(page, /usePageHeader/);
  assert.match(page, /ConfirmDialog/);
  assert.match(page, /Finalizar preparación/);
  assert.match(page, /PEDIDOS_FINALIZAR_PREPARACION/);
  assert.match(page, /returnTo/);
  assert.doesNotMatch(page, /left:\s*260px/);
});

test('F6.2 valida cantidades en tiempo real y guarda cada producto individualmente', async () => {
  const page = await readSource(
    'frontend/src/modules/bodega/pages/PreparacionWorkspacePage.jsx',
  );
  const table = await readSource(
    'frontend/src/modules/bodega/components/PreparationWorkspaceTable.jsx',
  );

  assert.match(page, /validatePreparedQuantity/);
  assert.match(page, /actualizarPreparacionDetalle/);
  assert.match(page, /replaceWarehouseDetail/);
  assert.match(table, /type="number"/);
  assert.match(table, /error=\{error \|\| undefined\}/);
  assert.match(table, /disabled=\{!changed \|\| Boolean\(error\)\}/);
  assert.match(table, /onChange=\{\(event\) => onChange/);
});

test('F6.2 solo habilita el cierre con preparación completa y sin cambios pendientes', async () => {
  const page = await readSource(
    'frontend/src/modules/bodega/pages/PreparacionWorkspacePage.jsx',
  );

  assert.match(page, /!progress\.complete/);
  assert.match(page, /hasUnsavedChanges/);
  assert.match(page, /savingDetailId !== null/);
  assert.match(page, /setConfirmFinalizeOpen\(true\)/);
  assert.match(page, /finalizarPreparacion\(id\)/);
});

test('F6.2 enlaza listado y drawer con el Workspace preservando el retorno', async () => {
  const page = await readSource(
    'frontend/src/modules/bodega/pages/PreparacionPage.jsx',
  );
  const table = await readSource(
    'frontend/src/modules/bodega/components/PreparationTable.jsx',
  );
  const drawer = await readSource(
    'frontend/src/modules/bodega/components/PreparationDetailDrawer.jsx',
  );

  assert.match(page, /navigate\(`\/bodega\/preparacion\/\$\{pedido\.id\}`/);
  assert.match(page, /returnTo: `\$\{location\.pathname\}\$\{location\.search\}`/);
  assert.match(table, /label: 'Abrir preparación'/);
  assert.match(drawer, /Abrir preparación/);
});

test('F6.2 conserva el centrado móvil dentro de la regla consolidada de Bodega', async () => {
  const css = await readSource(
    'frontend/src/modules/bodega/bodega.css',
  );

  assert.match(
    css,
    /warehouse-preparation-table td,[\s\S]*?warehouse-load-workspace-table td \{[\s\S]*?min-height: 4rem;[\s\S]*?align-items: center;/,
  );
  assert.match(
    css,
    /warehouse-preparation-table td::before,[\s\S]*?warehouse-load-workspace-table td::before \{[\s\S]*?align-self: center;[\s\S]*?justify-self: start;/,
  );
});

test('F6.2 conserva utilidades puras para validar y actualizar detalles', () => {
  assert.equal(validatePreparedQuantity('', 4), 'La cantidad preparada es obligatoria.');
  assert.equal(validatePreparedQuantity('1.5', 4), 'Ingresa una cantidad entera.');
  assert.equal(validatePreparedQuantity('-1', 4), 'La cantidad no puede ser negativa.');
  assert.equal(
    validatePreparedQuantity('5', 4),
    'No puede superar las 4 unidades solicitadas.',
  );
  assert.equal(validatePreparedQuantity('4', 4), '');

  const pedido = {
    detalles: [
      { id: 1, cantidad_preparada: 0, producto: { id: 10 } },
      { id: 2, cantidad_preparada: 1, producto: { id: 20 } },
    ],
  };
  const result = replaceWarehouseDetail(pedido, {
    id: 2,
    cantidad_preparada: 3,
  });

  assert.equal(result.detalles[0].cantidad_preparada, 0);
  assert.equal(result.detalles[1].cantidad_preparada, 3);
  assert.deepEqual(result.detalles[1].producto, { id: 20 });
});
