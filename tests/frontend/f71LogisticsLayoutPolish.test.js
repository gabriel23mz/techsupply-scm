import assert from 'node:assert/strict';
import {
  readFile,
} from 'node:fs/promises';
import test from 'node:test';

const projectRoot = new URL('../../', import.meta.url);

const readSource = (relativePath) =>
  readFile(new URL(relativePath, projectRoot), 'utf8');

test('F7A.1 acerca las pestañas de Jornadas al Topbar como Ubicaciones', async () => {
  const css = await readSource(
    'frontend/src/modules/logistica/logistica.css',
  );

  assert.match(css, /\.journeys-tabs\s*\{[\s\S]*?margin-top:\s*calc\(var\(--spacing-lg\) \* -1\)/);
  assert.match(css, /\.journeys-tabs\s*\{[\s\S]*?border-top:\s*0/);
  assert.match(css, /border-radius:\s*0 0 var\(--radius-lg\) var\(--radius-lg\)/);
});

test('F7A.1 estabiliza filtros y elimina el scroll de tablas paginadas', async () => {
  const page = await readSource(
    'frontend/src/modules/logistica/pages/JornadasPage.jsx',
  );
  const css = await readSource(
    'frontend/src/modules/logistica/logistica.css',
  );

  assert.match(page, /journeys-toolbar__search/);
  assert.match(page, /journeys-toolbar__status/);
  assert.match(page, /journeys-toolbar__meta/);
  assert.match(page, /hasDirectoryFilters/);
  assert.match(css, /journeys-toolbar__filters--listado[\s\S]*?14rem/);
  assert.match(css, /journeys-toolbar__status\s*\{[\s\S]*?width:\s*14rem/);
  assert.match(css, /journeys-orders-table \.ui-data-table__scroll,[\s\S]*?overflow:\s*visible/);
  assert.match(css, /journeys-table table[\s\S]*?table-layout:\s*fixed/);
});

test('F7A.1 limita la secuencia a cuatro puntos y F7B integra acciones sin footer', async () => {
  const detail = await readSource(
    'frontend/src/modules/logistica/pages/JornadaDetallePage.jsx',
  );
  const css = await readSource(
    'frontend/src/modules/logistica/logistica.css',
  );

  assert.match(detail, /journey-detail-page/);
  assert.match(detail, /despachosPorPunto\.length > 4/);
  assert.match(detail, /journey-points-list--scrollable/);
  assert.match(css, /journey-points-list--scrollable[\s\S]*?max-height:\s*46rem[\s\S]*?overflow-y:\s*auto/);
  assert.match(
    detail,
    /journey-progress-card[\s\S]*?\{operationalActions\}/,
  );
  assert.match(css, /journey-sidebar-actions[\s\S]*?grid-template-columns:\s*1fr/);
  assert.doesNotMatch(detail, /const inlineActions/);
  assert.doesNotMatch(css, /journey-workspace > \.workspace-shell__footer/);
  assert.doesNotMatch(css, /journey-detail-page[\s\S]*?padding-bottom:\s*6\.5rem/);
});

test('F7A.1 fija el mapa a tres tarjetas visibles y deja scroll interno', async () => {
  const layoutCss = await readSource(
    'frontend/src/modules/logistica/logistica.css',
  );
  const mapCss = await readSource(
    'frontend/src/modules/logistica/jornadas-mapa.css',
  );

  assert.match(layoutCss, /--journeys-map-workspace-height:\s*54rem/);
  assert.match(mapCss, /routes-map-panel[\s\S]*?height:\s*var\(--journeys-map-workspace-height, 54rem\)/);
  assert.match(mapCss, /routes-general-map-card[\s\S]*?height:\s*var\(--journeys-map-workspace-height, 54rem\)/);
  assert.match(mapCss, /routes-journey-card[\s\S]*?min-height:\s*12rem/);
  assert.match(mapCss, /routes-map-panel__list[\s\S]*?overflow-y:\s*auto/);
});

test('F7A.1 alinea filtros y acciones del módulo Camiones', async () => {
  const page = await readSource(
    'frontend/src/modules/camiones/pages/CamionesPage.jsx',
  );
  const css = await readSource(
    'frontend/src/modules/camiones/camiones.css',
  );

  assert.match(page, /trucks-toolbar__search/);
  assert.match(page, /trucks-toolbar__status/);
  assert.match(page, /trucks-toolbar__meta/);
  assert.match(css, /trucks-toolbar__filters[\s\S]*?minmax\(22rem, 36rem\) 14rem/);
  assert.match(css, /trucks-toolbar__status[\s\S]*?width:\s*14rem/);
  assert.match(css, /trucks-table \.ui-data-table__actions-heading,[\s\S]*?text-align:\s*center/);
  assert.match(css, /trucks-table \.ui-data-table__actions-cell \.ui-table-actions[\s\S]*?justify-content:\s*center/);
});
