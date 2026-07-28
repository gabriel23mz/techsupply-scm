import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(path, 'utf8');

test('F5.8 alinea los drawers de Pedidos y Ubicaciones con el patrón de Clientes', async () => {
  const [order, ordersCss, locationsCss] = await Promise.all([
    read('frontend/src/modules/pedidos/components/PedidoDetailDrawer.jsx'),
    read('frontend/src/modules/pedidos/pedidos.css'),
    read('frontend/src/modules/ubicaciones/ubicaciones.css'),
  ]);

  assert.match(order, /size="lg"/);
  assert.match(ordersCss, /order-detail-drawer__hero \{[\s\S]*grid-template-columns: repeat\(2/);
  assert.match(ordersCss, /order-detail-drawer__hero > div \{[\s\S]*background: var\(--color-surface\)/);
  assert.match(locationsCss, /location-detail-summary \{[\s\S]*border: 1px solid/);
  assert.match(locationsCss, /location-detail-summary > \.location-detail-row/);
});

test('F5.8 mantiene DateField compacto y alineado con su activador móvil', async () => {
  const [field, css] = await Promise.all([
    read('frontend/src/shared/ui/DateField/DateField.jsx'),
    read('frontend/src/shared/ui/DateField/DateField.css'),
  ]);

  assert.match(field, /const isMobileViewport = viewportWidth <= 576/);
  assert.match(field, /const desktopPanelWidth = 320/);
  assert.match(field, /isMobileViewport \? rect\.width : desktopPanelWidth/);
  assert.doesNotMatch(css, /width: calc\(100vw - 1rem\) !important/);
});

test('F5.8 reserva espacio de ayuda en Nuevo Pedido y el editor de productos', async () => {
  const css = await read('frontend/src/modules/pedidos/pedidos.css');

  assert.match(
    css,
    /new-order-form-grid > \.ui-form-field,[\s\S]*order-product-form__grid > \.ui-form-field[\s\S]*minmax\(1\.25rem, auto\)/,
  );
});

test('F5.8 centra acciones de productos y evita que el footer cubra el resumen', async () => {
  const [page, table, css] = await Promise.all([
    read('frontend/src/modules/pedidos/pages/PedidoWorkspacePage.jsx'),
    read('frontend/src/modules/pedidos/components/workspace/PedidoProductsTable.jsx'),
    read('frontend/src/modules/pedidos/pedidos.css'),
  ]);

  assert.match(page, /className="order-workspace-shell"/);
  assert.match(table, /width: '38%'/);
  assert.match(css, /order-products-table table \{[\s\S]*table-layout: fixed/);
  assert.match(css, /order-products-table \.ui-table-actions \{[\s\S]*justify-content: center/);
  assert.match(css, /order-workspace-shell > \.workspace-shell__footer \{[\s\S]*grid-column: 2;[\s\S]*background: transparent/);
});

test('F5.8 valida cantidad en tiempo real y confirma al descartar cambios', async () => {
  const form = await read(
    'frontend/src/modules/pedidos/components/workspace/PedidoProductForm.jsx',
  );

  assert.match(form, /hasQuantityChanges/);
  assert.match(form, /setTouched\(\(current\) => \(\{[\s\S]*cantidad: true/);
  assert.match(form, /title="Descartar cambio de cantidad"/);
  assert.match(form, /confirmText="Descartar cambio"/);
  assert.match(form, /onClick=\{handleCancelEdit\}/);
});
