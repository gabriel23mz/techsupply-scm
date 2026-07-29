import assert from 'node:assert/strict';
import {
  readFile,
} from 'node:fs/promises';
import test from 'node:test';

const projectRoot = new URL('../../', import.meta.url);

const readSource = (relativePath) =>
  readFile(new URL(relativePath, projectRoot), 'utf8');

test('F7A.2 reserva altura completa para acciones de las tarjetas del mapa', async () => {
  const layoutCss = await readSource(
    'frontend/src/modules/logistica/logistica.css',
  );
  const mapCss = await readSource(
    'frontend/src/modules/logistica/jornadas-mapa.css',
  );

  assert.match(layoutCss, /--journeys-map-workspace-height:\s*54rem/);
  assert.match(mapCss, /routes-journey-card[\s\S]*?min-height:\s*12rem/);
  assert.match(
    mapCss,
    /routes-journey-card[\s\S]*?grid-template-rows:\s*minmax\(0, 1fr\) auto/,
  );
  assert.match(
    mapCss,
    /routes-general-map-card[\s\S]*?var\(--journeys-map-workspace-height, 54rem\)/,
  );
});

test('F7A.2 estabiliza filtros, contador y botón Limpiar de Despachos', async () => {
  const toolbar = await readSource(
    'frontend/src/modules/despachos/components/DespachoToolbar.jsx',
  );
  const page = await readSource(
    'frontend/src/modules/despachos/pages/DespachosPage.jsx',
  );
  const css = await readSource(
    'frontend/src/modules/despachos/despachos.css',
  );

  assert.match(toolbar, /dispatch-toolbar__filters/);
  assert.match(toolbar, /dispatch-toolbar__search/);
  assert.match(toolbar, /dispatch-toolbar__status/);
  assert.match(toolbar, /dispatch-toolbar__date/);
  assert.match(toolbar, /dispatch-toolbar__meta/);
  assert.match(toolbar, /dispatch-toolbar__clear/);
  assert.match(page, /resultCount=\{filteredDispatches\.length\}/);
  assert.match(
    css,
    /dispatch-toolbar__filters[\s\S]*?minmax\(22rem, 28rem\) 14rem 14rem/,
  );
  assert.match(
    css,
    /dispatch-toolbar__status,[\s\S]*?dispatch-toolbar__date[\s\S]*?width:\s*14rem/,
  );
  assert.match(
    css,
    /dispatch-toolbar__meta[\s\S]*?justify-content:\s*flex-end[\s\S]*?margin-left:\s*auto/,
  );
});

test('F7A.2 amplía Pedido Cliente y compacta las acciones de Despachos', async () => {
  const table = await readSource(
    'frontend/src/modules/despachos/components/DespachosTable.jsx',
  );
  const css = await readSource(
    'frontend/src/modules/despachos/despachos.css',
  );

  assert.match(
    table,
    /header:\s*'Pedido \/ Cliente',[\s\S]*?width:\s*'22%'/,
  );
  assert.match(css, /dispatch-table table[\s\S]*?table-layout:\s*fixed/);
  assert.match(
    css,
    /dispatch-table \.ui-data-table__actions-heading,[\s\S]*?width:\s*10rem[\s\S]*?text-align:\s*center/,
  );
  assert.match(
    css,
    /dispatch-table \.ui-data-table__actions-cell \.ui-table-actions[\s\S]*?justify-content:\s*center/,
  );
  assert.match(
    css,
    /dispatch-table \.ui-table-actions__slot:empty[\s\S]*?display:\s*none/,
  );
});
