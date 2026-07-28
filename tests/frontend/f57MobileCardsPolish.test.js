import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(path, 'utf8');

test('F5.7 permite que el correo del drawer de Clientes use todo el ancho en escritorio', async () => {
  const [drawer, css] = await Promise.all([
    read('frontend/src/modules/clientes/components/ClienteDetailDrawer.jsx'),
    read('frontend/src/modules/clientes/clientes.css'),
  ]);

  assert.match(drawer, /className="client-detail-item--wide"[\s\S]*label="Correo electrónico"/);
  assert.match(css, /\.client-detail-item--wide \{\s*grid-column: 1 \/ -1;/);
});

test('F5.7 centra verticalmente etiquetas y valores de todas las tarjetas móviles', async () => {
  const css = await read('frontend/src/shared/ui/DataTable/DataTable.css');

  assert.match(css, /\.ui-data-table td \{[\s\S]*min-height: 3\.25rem;[\s\S]*align-items: center;/);
  assert.match(css, /\.ui-data-table td::before \{[\s\S]*align-self: center;[\s\S]*line-height: 1\.25;/);
});

test('F5.7 usa el ancho completo para las dos métricas inferiores de Pedidos en móvil', async () => {
  const css = await read('frontend/src/modules/pedidos/pedidos.css');

  assert.match(css, /orders-metrics > :nth-child\(3\) \{\s*grid-column: 1 \/ -1;/);
  assert.match(css, /orders-metrics > :nth-child\(4\) \{\s*grid-column: 1 \/ -1;/);
});
