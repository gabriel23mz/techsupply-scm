import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(path, 'utf8');

test('F5.9 reserva todo el ancho comercial para la validación de cantidad', async () => {
  const [form, css] = await Promise.all([
    read('frontend/src/modules/pedidos/components/workspace/PedidoProductForm.jsx'),
    read('frontend/src/modules/pedidos/pedidos.css'),
  ]);

  assert.match(form, /order-product-form__commerce-grid/);
  assert.match(form, /className="order-product-form__quantity-field"/);
  assert.match(css, /order-product-form__quantity-field > :is\([\s\S]*grid-column: 1 \/ -1;[\s\S]*grid-row: 3;/);
  assert.match(css, /order-product-form__quantity-field > :is\([\s\S]*white-space: nowrap;/);
});

test('F5.9 alinea a la derecha las acciones reales de cualquier tabla móvil', async () => {
  const css = await read('frontend/src/shared/ui/DataTable/DataTable.css');

  assert.match(
    css,
    /ui-data-table__actions-cell \.ui-table-actions \{[\s\S]*justify-self: end;[\s\S]*justify-content: end;/,
  );
  assert.match(
    css,
    /ui-data-table__actions-cell \.ui-table-actions__slot:empty \{\s*display: none;/,
  );
});

test('F5.9 distribuye Cliente y Responsable a ancho completo y comparte las fechas', async () => {
  const [drawer, css] = await Promise.all([
    read('frontend/src/modules/pedidos/components/PedidoDetailDrawer.jsx'),
    read('frontend/src/modules/pedidos/pedidos.css'),
  ]);

  assert.match(drawer, /className="order-detail-item--wide"[\s\S]*label="Cliente"/);
  assert.match(drawer, /className="order-detail-item--wide"[\s\S]*label="Responsable"/);
  assert.equal(
    drawer.match(/className="order-detail-item--wide"/g)?.length,
    2,
  );
  assert.match(drawer, /label="Fecha del pedido"/);
  assert.match(drawer, /label="Entrega estimada"/);
  assert.match(css, /order-detail-item--wide \{\s*grid-column: 1 \/ -1;/);
  assert.match(css, /order-detail-item \{[\s\S]*grid-template-columns: minmax\(7rem, 0\.34fr\) minmax\(0, 1fr\)/);
});

test('F5.9 mantiene Estado, Código, Latitud y Longitud en filas compactas', async () => {
  const css = await read('frontend/src/modules/ubicaciones/ubicaciones.css');

  assert.match(
    css,
    /location-detail-summary > \.location-detail-row \{[\s\S]*display: grid;[\s\S]*grid-template-columns: minmax\(6rem, 0\.45fr\) minmax\(0, 1fr\)/,
  );
  assert.match(
    css,
    /location-detail-grid > \.location-detail-row \{[\s\S]*display: grid;[\s\S]*grid-template-columns: minmax\(6rem, 0\.45fr\) minmax\(0, 1fr\)/,
  );
});
