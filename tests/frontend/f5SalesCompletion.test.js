import assert from 'node:assert/strict';
import {
  access,
  readFile,
  readdir,
} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

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

test('F5.2 reserva la Topbar como encabezado único de Pedidos', async () => {
  const page = await readSource(
    'frontend/src/modules/pedidos/pages/PedidosPage.jsx',
  );
  const workspace = await readSource(
    'frontend/src/modules/pedidos/pages/PedidoWorkspacePage.jsx',
  );
  const newPage = await readSource(
    'frontend/src/modules/pedidos/pages/NuevoPedidoPage.jsx',
  );

  for (const source of [page, workspace, newPage]) {
    assert.match(source, /usePageHeader/);
    assert.doesNotMatch(source, /PedidosBanner|PedidoWorkspaceHeader/);
    assert.doesNotMatch(source, /Módulo Outbound/);
  }

  assert.match(page, /topbar-page-action--refresh/);
  assert.match(page, /Nuevo pedido/);
  assert.match(workspace, /Editar información/);
});

test('F5.2 conserva filtros, página y retorno de Pedidos en la URL', async () => {
  const page = await readSource(
    'frontend/src/modules/pedidos/pages/PedidosPage.jsx',
  );
  const utils = await readSource(
    'frontend/src/modules/pedidos/pedido.utils.js',
  );
  const newPage = await readSource(
    'frontend/src/modules/pedidos/pages/NuevoPedidoPage.jsx',
  );
  const workspace = await readSource(
    'frontend/src/modules/pedidos/pages/PedidoWorkspacePage.jsx',
  );

  assert.match(page, /useSearchParams/);
  assert.match(page, /searchParams\.get\('q'\)/);
  assert.match(page, /searchParams\.get\('estado'\)/);
  assert.match(page, /searchParams\.get\('fecha'\)/);
  assert.match(page, /searchParams\.get\('page'\)/);
  assert.match(page, /buildReturnPath\(location\)/);
  assert.match(utils, /getReturnPath/);
  assert.match(newPage, /returnTo=/);
  assert.match(workspace, /navigate\(returnTo\)/);
});

test('F5.2 respeta permisos, propiedad y estado en las acciones comerciales', async () => {
  const page = await readSource(
    'frontend/src/modules/pedidos/pages/PedidosPage.jsx',
  );
  const table = await readSource(
    'frontend/src/modules/pedidos/components/PedidosTable.jsx',
  );
  const workspace = await readSource(
    'frontend/src/modules/pedidos/pages/PedidoWorkspacePage.jsx',
  );

  assert.match(page, /PERMISSIONS\.PEDIDOS_CREAR/);
  assert.match(page, /PERMISSIONS\.PEDIDOS_EDITAR/);
  assert.match(page, /PERMISSIONS\.PEDIDOS_ENVIAR_PREPARACION/);
  assert.match(page, /PERMISSIONS\.PEDIDOS_CANCELAR/);
  assert.match(table, /pedido\.estado === 'PENDIENTE'/);
  assert.match(table, /isAdmin/);
  assert.match(table, /bi bi-eye/);
  assert.match(table, /bi bi-layout-text-window-reverse/);
  assert.match(table, /bi bi-slash-circle/);
  assert.match(workspace, /const isPending = pedido\?\.estado === 'PENDIENTE'/);
  assert.match(workspace, /const canEdit = canEditOrder && isPending/);
  assert.match(workspace, /canSendPreparation/);
  assert.match(workspace, /canCancelOrder/);
});

test('F5.3 crea pedidos con responsable de sesión y validación dinámica', async () => {
  const page = await readSource(
    'frontend/src/modules/pedidos/pages/NuevoPedidoPage.jsx',
  );
  const form = await readSource(
    'frontend/src/modules/pedidos/components/NuevoPedidoForm.jsx',
  );

  assert.match(page, /const \{ user \} = useAuth\(\)/);
  assert.doesNotMatch(page, /obtenerUsuarios/);
  assert.match(form, /noValidate/);
  assert.match(form, /formatUser\(user\)/);
  assert.match(form, /disabled=\{!isValid\}/);
  assert.match(form, /cliente_id: Number\(formData\.cliente_id\)/);
  assert.match(form, /fecha: new Date\(\)\.toISOString\(\)/);
  assert.match(form, /fecha_entrega: formData\.fecha_entrega \|\| null/);
  assert.doesNotMatch(form, /<select\b/);
});

test('F5.4 usa WorkspaceShell sin conocer el ancho del Sidebar', async () => {
  const page = await readSource(
    'frontend/src/modules/pedidos/pages/PedidoWorkspacePage.jsx',
  );
  const shell = await readSource(
    'frontend/src/shared/layouts/WorkspaceShell.jsx',
  );
  const shellCss = await readSource(
    'frontend/src/shared/layouts/workspace-shell.css',
  );
  const pedidosCss = await readSource(
    'frontend/src/modules/pedidos/pedidos.css',
  );

  assert.match(page, /<WorkspaceShell/);
  assert.match(shell, /workspace-shell__sidebar/);
  assert.match(shell, /workspace-shell__content/);
  assert.match(shell, /workspace-shell__footer/);
  assert.match(shellCss, /grid-template-columns:/);
  assert.match(shellCss, /position: sticky/);
  assert.doesNotMatch(pedidosCss, /left:\s*260px/);
  assert.doesNotMatch(pedidosCss, /left:\s*var\(--current-sidebar-width\)/);
});

test('F5.4 mantiene formularios y productos en componentes compartidos', async () => {
  const editModal = await readSource(
    'frontend/src/modules/pedidos/components/PedidoEditModal.jsx',
  );
  const productForm = await readSource(
    'frontend/src/modules/pedidos/components/workspace/PedidoProductForm.jsx',
  );
  const productTable = await readSource(
    'frontend/src/modules/pedidos/components/workspace/PedidoProductsTable.jsx',
  );

  assert.match(editModal, /Modal/);
  assert.match(editModal, /Combobox/);
  assert.match(editModal, /DateField/);
  assert.match(editModal, /noValidate/);
  assert.match(productForm, /Combobox/);
  assert.match(productForm, /TextField/);
  assert.match(productForm, /disabled=\{!isValid\}/);
  assert.match(productTable, /DataTable/);
  assert.match(productTable, /TableActions|actions=/);
});

test('F5.5 coloca tabs de Ubicaciones inmediatamente bajo Topbar y persiste la vista', async () => {
  const page = await readSource(
    'frontend/src/modules/ubicaciones/pages/UbicacionesPage.jsx',
  );
  const tabsIndex = page.indexOf('<Tabs');
  const metricsIndex = page.indexOf('<UbicacionesMetrics');

  assert.match(page, /usePageHeader/);
  assert.ok(tabsIndex >= 0);
  assert.ok(metricsIndex > tabsIndex);
  assert.match(page, /searchParams\.get\('view'\)/);
  assert.match(page, /updateQuery\(\{ view, page: 1 \}\)/);
  assert.match(page, /PERMISSIONS\.UBICACIONES_GESTIONAR/);
  assert.match(page, /canManageLocations/);
  assert.doesNotMatch(page, /LOCATION_STATUS_OPTIONS/);
});

test('F5.5 reutiliza tablas, mapas, estados y validación en Ubicaciones', async () => {
  const table = await readSource(
    'frontend/src/modules/ubicaciones/components/UbicacionesTable.jsx',
  );
  const form = await readSource(
    'frontend/src/modules/ubicaciones/components/UbicacionFormModal.jsx',
  );
  const map = await readSource(
    'frontend/src/modules/ubicaciones/components/UbicacionesMapaGeneral.jsx',
  );
  const page = await readSource(
    'frontend/src/modules/ubicaciones/pages/UbicacionesPage.jsx',
  );

  assert.match(table, /DataTable/);
  assert.match(table, /canManage/);
  assert.match(table, /bi bi-eye/);
  assert.match(table, /bi bi-pencil-square/);
  assert.match(table, /bi bi-slash-circle/);
  assert.match(form, /MapShell/);
  assert.match(form, /MapControls/);
  assert.match(form, /MapViewportController/);
  assert.match(form, /noValidate/);
  assert.match(form, /disabled=\{!isValid\}/);
  assert.match(map, /MapShell/);
  assert.doesNotMatch(page, /onRefresh=/);
});

test('F5 elimina adaptadores y encabezados muertos de Ventas', async () => {
  const removedFiles = [
    'frontend/src/modules/pedidos/components/PedidoFlowCard.jsx',
    'frontend/src/modules/pedidos/components/PedidoMetricCard.jsx',
    'frontend/src/modules/pedidos/components/PedidosPagination.jsx',
    'frontend/src/modules/pedidos/components/PedidosToolbar.jsx',
    'frontend/src/modules/pedidos/components/workspace/PedidoWorkspaceHeader.jsx',
    'frontend/src/modules/ubicaciones/components/UbicacionesTabs.jsx',
  ];

  for (const file of removedFiles) {
    await assert.rejects(access(new URL(file, projectRoot)));
  }
});

test('F5 evita controles Bootstrap directos en Pedidos y Ubicaciones', async () => {
  const sources = [
    ...(await readSourcesRecursively('frontend/src/modules/pedidos')),
    ...(await readSourcesRecursively('frontend/src/modules/ubicaciones')),
  ];

  const forbidden = /className="[^"]*(?:^|\s)(?:btn(?:-[\w-]+)?|form-control|form-select|table|alert)(?:\s|")/m;

  for (const file of sources) {
    assert.doesNotMatch(
      file.source,
      forbidden,
      `${file.path} debe reutilizar la biblioteca compartida`,
    );
  }
});
