import assert from 'node:assert/strict';
import {
  readFile,
  readdir,
} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {
  getPreparationProgress,
  matchesPreparationStatus,
} from '../../frontend/src/modules/bodega/bodega.utils.js';

const projectRoot = new URL('../../', import.meta.url);

const readSource = (relativePath) =>
  readFile(new URL(relativePath, projectRoot), 'utf8');

async function readSourcesRecursively(relativeDirectory) {
  const directory = new URL(relativeDirectory, projectRoot);
  const entries = await readdir(directory, { withFileTypes: true });
  const sources = [];

  for (const entry of entries) {
    const relativePath = path.posix.join(relativeDirectory, entry.name);

    if (entry.isDirectory()) {
      sources.push(...(await readSourcesRecursively(relativePath)));
    } else if (/\.(js|jsx)$/.test(entry.name)) {
      sources.push({
        path: relativePath,
        source: await readSource(relativePath),
      });
    }
  }

  return sources;
}

test('F6.1 registra Preparación como módulo propio de ADMIN y BODEGA', async () => {
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

  assert.match(routes, /id: 'bodega-preparacion'/);
  assert.match(routes, /path: '\/bodega\/preparacion'/);
  assert.match(routes, /PERMISSIONS\.PEDIDOS_PREPARAR/);
  assert.match(routes, /ROLES\.BODEGA/);
  assert.match(routes, /ROLES\.ADMIN/);
  assert.match(components, /modules\/bodega\/pages\/PreparacionPage/);
  assert.match(navigation, /id: 'bodega'/);
  assert.match(navigation, /'bodega-preparacion'/);
  assert.match(dashboardAccess, /PREPARACION:[\s\S]*?routeId: 'bodega-preparacion'/);
});

test('F6.1 consume los contratos de lectura existentes de Bodega', async () => {
  const service = await readSource(
    'frontend/src/modules/bodega/services/bodega.service.js',
  );

  assert.match(service, /api\.get\('\/bodega\/pedidos'\)/);
  assert.match(service, /api\.get\(`\/bodega\/pedidos\/\$\{id\}`\)/);
});

test('F6.1 conserva búsqueda, avance y página en la URL', async () => {
  const page = await readSource(
    'frontend/src/modules/bodega/pages/PreparacionPage.jsx',
  );

  assert.match(page, /useSearchParams/);
  assert.match(page, /searchParams\.get\('q'\)/);
  assert.match(page, /searchParams\.get\('estado'\)/);
  assert.match(page, /searchParams\.get\('page'\)/);
  assert.match(page, /updateQuery\(\{ q: event\.target\.value, page: 1 \}\)/);
  assert.match(page, /updateQuery\(\{ estado: value, page: 1 \}\)/);
  assert.match(page, /Pagination/);
});

test('F6.1 usa la Topbar y la biblioteca UI compartida', async () => {
  const page = await readSource(
    'frontend/src/modules/bodega/pages/PreparacionPage.jsx',
  );
  const table = await readSource(
    'frontend/src/modules/bodega/components/PreparationTable.jsx',
  );
  const drawer = await readSource(
    'frontend/src/modules/bodega/components/PreparationDetailDrawer.jsx',
  );

  assert.match(page, /usePageHeader/);
  assert.match(page, /title: 'Preparación'/);
  assert.match(page, /StatCard/);
  assert.match(page, /SearchField/);
  assert.match(page, /SelectField/);
  assert.match(page, /LoadingState/);
  assert.match(page, /ErrorState/);
  assert.match(table, /DataTable/);
  assert.match(table, /bi bi-eye/);
  assert.match(drawer, /Drawer/);
  assert.match(drawer, /StatusBadge/);
});

test('F6.1 deriva progreso y estados sin duplicar reglas del backend', () => {
  const pedido = {
    detalles: [
      { cantidad: 3, cantidad_preparada: 3 },
      { cantidad: 2, cantidad_preparada: 1 },
    ],
  };

  assert.deepEqual(getPreparationProgress(pedido), {
    complete: false,
    pending: 1,
    percentage: 80,
    prepared: 4,
    requested: 5,
    status: 'EN_PROGRESO',
  });
  assert.equal(matchesPreparationStatus(pedido, 'EN_PROGRESO'), true);
  assert.equal(matchesPreparationStatus(pedido, 'COMPLETO'), false);

  const complete = {
    progreso_preparacion: {
      solicitado: 5,
      preparado: 5,
      completo: true,
    },
  };

  assert.equal(getPreparationProgress(complete).status, 'COMPLETO');
});

test('F6.1 evita controles Bootstrap directos dentro del módulo Bodega', async () => {
  const sources = await readSourcesRecursively(
    'frontend/src/modules/bodega',
  );
  const forbidden = /className="[^"]*(?:^|\s)(?:btn(?:-[\w-]+)?|form-control|form-select|table|alert)(?:\s|")/m;

  for (const file of sources) {
    assert.doesNotMatch(
      file.source,
      forbidden,
      `${file.path} debe reutilizar la biblioteca compartida`,
    );
  }
});
