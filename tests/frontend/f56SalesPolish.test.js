import assert from 'node:assert/strict';
import {
  readFile,
} from 'node:fs/promises';
import test from 'node:test';

const projectRoot = new URL('../../', import.meta.url);

const readSource = (relativePath) =>
  readFile(new URL(relativePath, projectRoot), 'utf8');

test('F5.6 incorpora DateField personalizable y elimina fechas nativas de Ventas', async () => {
  const index = await readSource('frontend/src/shared/ui/index.js');
  const dateField = await readSource(
    'frontend/src/shared/ui/DateField/DateField.jsx',
  );
  const newOrder = await readSource(
    'frontend/src/modules/pedidos/components/NuevoPedidoForm.jsx',
  );
  const editOrder = await readSource(
    'frontend/src/modules/pedidos/components/PedidoEditModal.jsx',
  );

  assert.match(index, /default as DateField/);
  assert.match(dateField, /createPortal/);
  assert.match(dateField, /ui-date-field__days/);
  assert.match(dateField, /Mes anterior/);
  assert.match(dateField, /Mes siguiente/);
  assert.match(newOrder, /<DateField/);
  assert.match(editOrder, /<DateField/);
  assert.doesNotMatch(newOrder, /type="date"/);
  assert.doesNotMatch(editOrder, /type="date"/);
});

test('F5.6 muestra Limpiar solo cuando existen filtros', async () => {
  const orders = await readSource(
    'frontend/src/modules/pedidos/pages/PedidosPage.jsx',
  );
  const locations = await readSource(
    'frontend/src/modules/ubicaciones/pages/UbicacionesPage.jsx',
  );

  assert.match(orders, /\{hasFilters && \([\s\S]*Limpiar/);
  assert.match(locations, /\{hasFilters && \([\s\S]*Limpiar/);
  assert.doesNotMatch(orders, /disabled=\{!hasFilters\}/);
  assert.doesNotMatch(locations, /disabled=\{!hasFilters\}/);
});

test('F5.6 oculta acciones comerciales incompatibles y conserva slots', async () => {
  const table = await readSource(
    'frontend/src/modules/pedidos/components/PedidosTable.jsx',
  );

  assert.match(table, /visible: editable/);
  assert.match(table, /visible: cancelable/);
  assert.doesNotMatch(table, /disabled: !editable/);
  assert.doesNotMatch(table, /disabled: !cancelable/);
});

test('F5.6 compacta el Workspace y hace evidente la edición', async () => {
  const page = await readSource(
    'frontend/src/modules/pedidos/pages/PedidoWorkspacePage.jsx',
  );
  const actions = await readSource(
    'frontend/src/modules/pedidos/components/workspace/PedidoWorkspaceActions.jsx',
  );
  const products = await readSource(
    'frontend/src/modules/pedidos/components/workspace/PedidoProductsTable.jsx',
  );
  const form = await readSource(
    'frontend/src/modules/pedidos/components/workspace/PedidoProductForm.jsx',
  );
  const shellCss = await readSource(
    'frontend/src/shared/layouts/workspace-shell.css',
  );

  assert.match(page, /handleEditDetail/);
  assert.match(page, /scrollIntoView/);
  assert.match(products, /activeDetailId/);
  assert.match(products, /order-products-table__row--editing/);
  assert.match(form, /Edición activa/);
  assert.match(form, /<FormField[\s\S]*?label="Precio unitario"/);
  assert.match(form, /<FormField[\s\S]*?label="Subtotal"/);
  assert.doesNotMatch(actions, /Volver al listado/);
  assert.match(shellCss, /workspace-shell__footer[\s\S]*position: static/);
});

test('F5.6 impide que los controles del mapa muevan el marcador', async () => {
  const controls = await readSource(
    'frontend/src/shared/maps/MapControls/MapControls.jsx',
  );

  assert.match(controls, /disableClickPropagation/);
  assert.match(controls, /disableScrollPropagation/);
  assert.match(controls, /map\.zoomOut\(\)/);
  assert.match(controls, /handleReset/);
});

test('F5.6 elimina la doble X de SearchField', async () => {
  const textFieldCss = await readSource(
    'frontend/src/shared/ui/TextField/TextField.css',
  );

  assert.match(textFieldCss, /webkit-search-cancel-button/);
  assert.match(textFieldCss, /::-ms-clear/);
});

test('F5.6 alinea acciones móviles de todos los DataTable', async () => {
  const tableCss = await readSource(
    'frontend/src/shared/ui/DataTable/DataTable.css',
  );
  const pedidosCss = await readSource(
    'frontend/src/modules/pedidos/pedidos.css',
  );

  assert.match(
    tableCss,
    /ui-data-table__actions-cell \.ui-table-actions \{[\s\S]*justify-self: end/,
  );
  assert.match(
    pedidosCss,
    /orders-status-cell \.ui-status-badge \{[\s\S]*justify-self: end/,
  );
});

test('F5.6 aprovecha el espacio en drawers de Clientes, Pedidos y Ubicaciones', async () => {
  const client = await readSource(
    'frontend/src/modules/clientes/components/ClienteDetailDrawer.jsx',
  );
  const order = await readSource(
    'frontend/src/modules/pedidos/components/PedidoDetailDrawer.jsx',
  );
  const location = await readSource(
    'frontend/src/modules/ubicaciones/components/UbicacionDetailModal.jsx',
  );

  assert.match(client, /client-detail-drawer/);
  assert.match(client, /Código del cliente/);
  assert.doesNotMatch(client, /client-detail-heading__icon/);
  assert.match(order, /OrderDetailItem/);
  assert.match(order, /Total del pedido/);
  assert.match(location, /LocationDetailRow/);
});

test('F5.6 limita el mapa general y conserva scroll en la lista', async () => {
  const css = await readSource(
    'frontend/src/modules/ubicaciones/ubicaciones.css',
  );

  assert.match(css, /height: clamp\(34rem, 72vh, 48rem\)/);
  assert.match(css, /locations-map-list__content[\s\S]*overflow-y: auto/);
  assert.match(css, /minmax\(16rem, 34rem\) auto/);
});
