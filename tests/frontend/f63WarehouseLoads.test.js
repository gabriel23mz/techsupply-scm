import assert from 'node:assert/strict';
import {
  readFile,
} from 'node:fs/promises';
import test from 'node:test';

import {
  getLoadProgress,
  matchesLoadStatus,
} from '../../frontend/src/modules/bodega/bodega.utils.js';

const projectRoot = new URL('../../', import.meta.url);
const readSource = (relativePath) =>
  readFile(new URL(relativePath, projectRoot), 'utf8');

test('F6.3 registra Carga como módulo propio de ADMIN y BODEGA', async () => {
  const routes = await readSource(
    'frontend/src/shared/routing/routeRegistry.jsx',
  );
  const components = await readSource(
    'frontend/src/shared/routing/routeComponents.jsx',
  );
  const navigation = await readSource(
    'frontend/src/shared/constants/navigation.jsx',
  );
  const dashboardAccess = await readSource(
    'frontend/src/shared/routing/dashboardAccess.js',
  );

  assert.match(routes, /id: 'bodega-cargas'/);
  assert.match(routes, /path: '\/bodega\/cargas'/);
  assert.match(routes, /PERMISSIONS\.CARGAS_LEER/);
  assert.match(routes, /ROLES\.BODEGA/);
  assert.match(routes, /element: <BodegaCargasPage \/>/);
  assert.match(components, /modules\/bodega\/pages\/CargasPage/);
  assert.match(navigation, /'bodega-cargas'/);
  assert.match(dashboardAccess, /CARGA:[\s\S]*?routeId: 'bodega-cargas'/);
});

test('F6.3 consume los contratos vigentes de lectura de carga', async () => {
  const service = await readSource(
    'frontend/src/modules/bodega/services/bodega.service.js',
  );

  assert.match(service, /api\.get\('\/bodega\/jornadas'\)/);
  assert.match(
    service,
    /api\.get\(`\/bodega\/jornadas\/\$\{id\}\/carga`\)/,
  );
});

test('F6.3 conserva búsqueda, avance y página de cargas en la URL', async () => {
  const page = await readSource(
    'frontend/src/modules/bodega/pages/CargasPage.jsx',
  );

  assert.match(page, /useSearchParams/);
  assert.match(page, /searchParams\.get\('q'\)/);
  assert.match(page, /searchParams\.get\('estado'\)/);
  assert.match(page, /searchParams\.get\('page'\)/);
  assert.match(page, /LOAD_STATUS_OPTIONS/);
  assert.match(page, /Pagination/);
  assert.match(page, /hasFilters &&/);
});

test('F6.3 usa Topbar, métricas, tabla y drawer compartidos', async () => {
  const page = await readSource(
    'frontend/src/modules/bodega/pages/CargasPage.jsx',
  );
  const table = await readSource(
    'frontend/src/modules/bodega/components/LoadTable.jsx',
  );
  const drawer = await readSource(
    'frontend/src/modules/bodega/components/LoadDetailDrawer.jsx',
  );

  assert.match(page, /usePageHeader/);
  assert.match(page, /StatCard/);
  assert.match(page, /SearchField/);
  assert.match(page, /SelectField/);
  assert.match(table, /DataTable/);
  assert.match(table, /bi bi-eye/);
  assert.match(table, /bi bi-truck-flatbed/);
  assert.match(drawer, /Drawer/);
  assert.match(drawer, /Abrir carga/);
});

test('F6.3 deriva estados de carga sin duplicar reglas del backend', () => {
  const jornada = {
    despachos: [
      { id: 1, cargado: true },
      { id: 2, cargado: false },
      { id: 3, cargado: true },
    ],
  };

  assert.deepEqual(getLoadProgress(jornada), {
    complete: false,
    confirmed: false,
    loaded: 2,
    pending: 1,
    percentage: 67,
    status: 'EN_PROGRESO',
    total: 3,
  });
  assert.equal(matchesLoadStatus(jornada, 'EN_PROGRESO'), true);
  assert.equal(matchesLoadStatus(jornada, 'COMPLETA'), false);

  const confirmed = {
    ...jornada,
    carga_confirmada_en: '2026-07-28T10:00:00.000Z',
    progreso_carga: {
      total: 3,
      cargados: 3,
      completo: true,
    },
  };

  assert.equal(getLoadProgress(confirmed).status, 'CONFIRMADA');
});

test('F6.3 corrige anchos, estado y acciones de Preparación', async () => {
  const table = await readSource(
    'frontend/src/modules/bodega/components/PreparationTable.jsx',
  );
  const workspaceTable = await readSource(
    'frontend/src/modules/bodega/components/PreparationWorkspaceTable.jsx',
  );
  const css = await readSource(
    'frontend/src/modules/bodega/bodega.css',
  );

  assert.match(table, /id: 'progreso',[\s\S]*?width: '18%'/);
  assert.match(table, /id: 'estado',[\s\S]*?width: '11%'/);
  assert.match(workspaceTable, /id: 'acciones',[\s\S]*?width: '17%'/);
  assert.match(css, /warehouse-quantity-field \{[\s\S]*?7rem/);
  assert.match(css, /warehouse-preparation-drawer__hero \.ui-status-badge/);
});
