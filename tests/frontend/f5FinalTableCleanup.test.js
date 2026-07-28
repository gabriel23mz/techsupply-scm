import assert from 'node:assert/strict';
import {
  access,
  readFile,
} from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(path, 'utf8');

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

test('F5 cierre unifica la composición móvil de todas las DataTable', async () => {
  const component = await read(
    'frontend/src/shared/ui/DataTable/DataTable.jsx',
  );
  const styles = await read(
    'frontend/src/shared/ui/DataTable/DataTable.css',
  );

  assert.match(component, /ui-data-table__cell-content/);
  assert.match(styles, /grid-template-columns:\s*minmax\(7\.5rem, 42%\)\s*minmax\(0, 1fr\)/);
  assert.match(styles, /\.ui-data-table__cell-content \{[\s\S]*justify-items: end;[\s\S]*text-align: right;/);
  assert.match(styles, /div\.ui-data-table \.ui-data-table__actions-cell \{[\s\S]*width: 100%;/);
  assert.match(styles, /\.ui-data-table__actions-cell \.ui-table-actions__slot:empty \{\s*display: none;/);
});

test('F5 cierre evita el desbordamiento del subtotal en el editor de productos', async () => {
  const styles = await read(
    'frontend/src/modules/pedidos/pedidos.css',
  );

  assert.match(styles, /\.order-product-form__grid \{[\s\S]*grid-template-columns:\s*minmax\(0, 1\.15fr\) minmax\(0, 1fr\);/);
  assert.match(styles, /\.order-product-form__commerce-grid \{[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 1180px\)[\s\S]*\.order-product-form__grid \{\s*grid-template-columns: 1fr;/);
  assert.doesNotMatch(styles, /minmax\(24rem, 1fr\)/);
});

test('F5 cierre elimina adaptadores y selectores muertos de los módulos migrados', async () => {
  const clientsPage = await read(
    'frontend/src/modules/clientes/pages/ClientesPage.jsx',
  );
  const ordersStyles = await read(
    'frontend/src/modules/pedidos/pedidos.css',
  );

  assert.equal(
    await exists(
      'frontend/src/modules/clientes/components/ClientesPagination.jsx',
    ),
    false,
  );
  assert.match(clientsPage, /Pagination,/);
  assert.doesNotMatch(clientsPage, /ClientesPagination/);
  assert.doesNotMatch(ordersStyles, /location-form__section-heading/);
});
