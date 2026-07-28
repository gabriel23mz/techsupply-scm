import assert from 'node:assert/strict';
import {
  readFile,
} from 'node:fs/promises';
import test from 'node:test';

import {
  replaceWarehouseDispatch,
} from '../../frontend/src/modules/bodega/bodega.utils.js';

const projectRoot = new URL('../../', import.meta.url);
const readSource = (relativePath) =>
  readFile(new URL(relativePath, projectRoot), 'utf8');

test('F6.4 registra el Workspace de carga como ruta protegida y oculta', async () => {
  const routes = await readSource(
    'frontend/src/shared/routing/routeRegistry.jsx',
  );
  const components = await readSource(
    'frontend/src/shared/routing/routeComponents.jsx',
  );

  assert.match(routes, /id: 'bodega-carga-workspace'/);
  assert.match(routes, /path: '\/bodega\/cargas\/:id'/);
  assert.match(routes, /PERMISSIONS\.CARGAS_LEER/);
  assert.match(routes, /element: <BodegaCargaWorkspacePage \/>/);
  assert.match(routes, /hidden: true/);
  assert.match(components, /modules\/bodega\/pages\/CargaWorkspacePage/);
});

test('F6.4 consume actualización y confirmación con contratos existentes', async () => {
  const service = await readSource(
    'frontend/src/modules/bodega/services/bodega.service.js',
  );

  assert.match(
    service,
    /api\.patch\(\s*`\/bodega\/despachos\/\$\{id\}\/carga`/,
  );
  assert.match(service, /cargado: Boolean\(cargado\)/);
  assert.match(
    service,
    /api\.patch\(\s*`\/bodega\/jornadas\/\$\{id\}\/confirmar-carga`/,
  );
});

test('F6.4 usa WorkspaceShell y controla acciones por permiso', async () => {
  const page = await readSource(
    'frontend/src/modules/bodega/pages/CargaWorkspacePage.jsx',
  );

  assert.match(page, /WorkspaceShell/);
  assert.match(page, /PERMISSIONS\.CARGAS_ACTUALIZAR/);
  assert.match(page, /PERMISSIONS\.CARGAS_CONFIRMAR/);
  assert.match(page, /ConfirmDialog/);
  assert.match(page, /Confirmar carga/);
  assert.match(page, /returnTo/);
});

test('F6.4 actualiza cada despacho y permite reabrir una carga confirmada con advertencia', async () => {
  const page = await readSource(
    'frontend/src/modules/bodega/pages/CargaWorkspacePage.jsx',
  );
  const table = await readSource(
    'frontend/src/modules/bodega/components/LoadWorkspaceTable.jsx',
  );

  assert.match(page, /actualizarCargaDespacho/);
  assert.match(page, /pendingReopen/);
  assert.match(page, /Reabrir carga confirmada/);
  assert.match(table, /Checkbox/);
  assert.match(table, /disabled=\{!canUpdate \|\| updating\}/);
  assert.match(table, /onToggle\?\./);
});

test('F6.4 solo confirma cuando todos los despachos están cargados', async () => {
  const page = await readSource(
    'frontend/src/modules/bodega/pages/CargaWorkspacePage.jsx',
  );

  assert.match(page, /!progress\.complete/);
  assert.match(page, /progress\.confirmed/);
  assert.match(page, /updatingDispatchId !== null/);
  assert.match(page, /confirmarCargaJornada\(id\)/);
  assert.match(page, /setConfirmLoadOpen\(true\)/);
});

test('F6.4 limita el footer a la columna operativa y centra tarjetas móviles', async () => {
  const css = await readSource(
    'frontend/src/modules/bodega/bodega.css',
  );

  assert.match(
    css,
    /warehouse-workspace > \.workspace-shell__footer \{\s*grid-column: 2;/,
  );
  assert.match(
    css,
    /warehouse-preparation-table td,[\s\S]*?warehouse-load-workspace-table td \{[\s\S]*?min-height: 4rem;[\s\S]*?grid-template-columns: minmax\(7\.5rem, 42%\) minmax\(0, 1fr\);[\s\S]*?align-items: center;/,
  );
  assert.match(
    css,
    /warehouse-load-workspace-table \.ui-data-table__cell-content[\s\S]*?justify-content: flex-end/,
  );
});

test('F6.4 conserva relaciones al reemplazar un despacho cargado', () => {
  const jornada = {
    carga_confirmada: true,
    carga_confirmada_en: '2026-07-28T10:00:00.000Z',
    despachos: [
      {
        id: 1,
        cargado: true,
        pedido: { id: 10, cliente: { id: 20 } },
      },
      {
        id: 2,
        cargado: false,
        pedido: { id: 11 },
      },
    ],
  };

  const result = replaceWarehouseDispatch(jornada, {
    id: 1,
    cargado: false,
  });

  assert.equal(result.carga_confirmada, false);
  assert.equal(result.carga_confirmada_en, null);
  assert.equal(result.despachos[0].cargado, false);
  assert.deepEqual(result.despachos[0].pedido, {
    id: 10,
    cliente: { id: 20 },
  });
});
