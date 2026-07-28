import assert from 'node:assert/strict';
import {
  readdir,
  readFile,
} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = new URL('../../', import.meta.url);

const readSource = (relativePath) =>
  readFile(new URL(relativePath, projectRoot), 'utf8');

async function readSourcesRecursively(relativeDirectory) {
  const absoluteDirectory = new URL(relativeDirectory, projectRoot);
  const entries = await readdir(absoluteDirectory, {
    withFileTypes: true,
  });
  const sources = [];

  for (const entry of entries) {
    const relativePath = path.posix.join(
      relativeDirectory,
      entry.name,
    );

    if (entry.isDirectory()) {
      sources.push(
        ...(await readSourcesRecursively(relativePath)),
      );
    } else if (/\.(js|jsx)$/.test(entry.name)) {
      sources.push({
        path: relativePath,
        source: await readSource(relativePath),
      });
    }
  }

  return sources;
}

test('F3 incorpora la biblioteca UI base congelada por la auditoría', async () => {
  const index = await readSource(
    'frontend/src/shared/ui/index.js',
  );
  const expectedExports = [
    'Button',
    'IconButton',
    'FormField',
    'TextField',
    'SearchField',
    'Combobox',
    'SelectField',
    'Checkbox',
    'StatusBadge',
    'StatCard',
    'Modal',
    'Drawer',
    'ConfirmDialog',
    'LoadingState',
    'EmptyState',
    'ErrorState',
    'Tabs',
    'Pagination',
    'DataTable',
    'TableActions',
    'ToastViewport',
  ];

  for (const component of expectedExports) {
    assert.match(
      index,
      new RegExp(`default as ${component}`),
      component,
    );
  }
});

test('F3 reemplaza selects nativos por un Combobox personalizable y accesible', async () => {
  const frontendSources = await readSourcesRecursively(
    'frontend/src',
  );
  const combobox = await readSource(
    'frontend/src/shared/ui/Combobox/Combobox.jsx',
  );

  for (const file of frontendSources) {
    assert.doesNotMatch(
      file.source,
      /<select\b/,
      `${file.path} no debe usar select nativo`,
    );
  }

  assert.match(combobox, /role="combobox"/);
  assert.match(combobox, /createPortal/);
  assert.match(combobox, /role="listbox"/);
  assert.match(combobox, /role="option"/);
  assert.match(combobox, /aria-expanded=\{open\}/);
  assert.match(combobox, /ArrowDown/);
  assert.match(combobox, /ArrowUp/);
  assert.match(combobox, /Home/);
  assert.match(combobox, /End/);
  assert.match(combobox, /Escape/);
});

test('F3 unifica diálogos con portal, foco, Escape y bloqueo de scroll', async () => {
  const modal = await readSource(
    'frontend/src/shared/ui/Modal/Modal.jsx',
  );
  const drawer = await readSource(
    'frontend/src/shared/ui/Drawer/Drawer.jsx',
  );
  const lifecycle = await readSource(
    'frontend/src/shared/ui/internal/useDialogLifecycle.js',
  );
  const compatibility = await readSource(
    'frontend/src/shared/components/ConfirmDialog/ConfirmDialog.jsx',
  );

  assert.match(modal, /createPortal/);
  assert.match(drawer, /createPortal/);
  assert.match(modal, /aria-modal="true"/);
  assert.match(drawer, /aria-modal="true"/);
  assert.match(lifecycle, /event\.key === 'Escape'/);
  assert.match(lifecycle, /event\.key !== 'Tab'/);
  assert.match(lifecycle, /ui-scroll-locked/);
  assert.match(lifecycle, /previousFocusRef/);
  assert.match(
    compatibility,
    /ui\/ConfirmDialog\/ConfirmDialog/,
  );
});

test('F3 centraliza métricas, estados y paginación mediante adaptadores compartidos', async () => {
  const files = [
    [
      'frontend/src/modules/dashboard/components/MetricCard.jsx',
      /StatCard/,
    ],
    [
      'frontend/src/modules/pedidos/pages/PedidosPage.jsx',
      /StatCard/,
    ],
    [
      'frontend/src/modules/pedidos/components/PedidoStatusBadge.jsx',
      /StatusBadge/,
    ],
    [
      'frontend/src/modules/despachos/components/DespachoStatusBadge.jsx',
      /StatusBadge/,
    ],
    [
      'frontend/src/modules/clientes/pages/ClientesPage.jsx',
      /Pagination/,
    ],
    [
      'frontend/src/modules/pedidos/pages/PedidosPage.jsx',
      /Pagination/,
    ],
    [
      'frontend/src/modules/despachos/components/DespachosPagination.jsx',
      /Pagination/,
    ],
    [
      'frontend/src/modules/rutas/components/RoutesPagination.jsx',
      /Pagination/,
    ],
  ];

  for (const [file, pattern] of files) {
    const source = await readSource(file);
    assert.match(source, pattern, file);
  }
});

test('F3 prepara tablas responsive, acciones alineadas y pestañas accesibles', async () => {
  const table = await readSource(
    'frontend/src/shared/ui/DataTable/DataTable.jsx',
  );
  const tableCss = await readSource(
    'frontend/src/shared/ui/DataTable/DataTable.css',
  );
  const actions = await readSource(
    'frontend/src/shared/ui/TableActions/TableActions.jsx',
  );
  const actionsCss = await readSource(
    'frontend/src/shared/ui/TableActions/TableActions.css',
  );
  const tabs = await readSource(
    'frontend/src/shared/ui/Tabs/Tabs.jsx',
  );

  assert.match(table, /actionsLabel = 'Acciones'/);
  assert.match(table, /\{actionsLabel\}/);
  assert.match(table, /data-label=\{actionsLabel\}/);
  assert.match(table, /data-label=/);
  assert.match(table, /LoadingState/);
  assert.match(table, /EmptyState/);
  assert.match(table, /ErrorState/);
  assert.match(tableCss, /@media \(max-width: 700px\)/);
  assert.match(tableCss, /content: attr\(data-label\)/);
  assert.match(actions, /DEFAULT_SLOTS = \['view', 'edit', 'delete'\]/);
  assert.match(actionsCss, /opacity: 1/);
  assert.match(actionsCss, /pointer-events: auto/);
  assert.match(tabs, /ArrowRight/);
  assert.match(tabs, /ArrowLeft/);
  assert.match(tabs, /Home/);
  assert.match(tabs, /End/);
});

test('F3 centraliza el viewport de toast y tokens de controles', async () => {
  const providers = await readSource(
    'frontend/src/app/providers.jsx',
  );
  const toast = await readSource(
    'frontend/src/shared/ui/ToastViewport/ToastViewport.jsx',
  );
  const variables = await readSource(
    'frontend/src/shared/styles/variables.css',
  );

  assert.match(providers, /<ToastViewport \/>/);
  assert.doesNotMatch(providers, /function ThemedToastContainer/);
  assert.match(toast, /resolvedTheme/);
  assert.match(variables, /--control-height-sm:/);
  assert.match(variables, /--control-height-md:/);
  assert.match(variables, /--control-height-lg:/);
  assert.match(variables, /--shadow-danger-focus:/);
});

test('F3.1 alinea el panel del Combobox con su activador y evita separaciones al abrir arriba', async () => {
  const combobox = await readSource(
    'frontend/src/shared/ui/Combobox/Combobox.jsx',
  );
  const comboboxCss = await readSource(
    'frontend/src/shared/ui/Combobox/Combobox.css',
  );

  assert.match(combobox, /const panelGap = 5;/);
  assert.match(combobox, /const panelWidth = Math\.min\(\s*rect\.width,/);
  assert.doesNotMatch(combobox, /Math\.max\(rect\.width,\s*240\)/);
  assert.match(
    combobox,
    /bottom:\s*viewportHeight - rect\.top \+ panelGap/,
  );
  assert.match(
    combobox,
    /data-placement=\{panelPosition\.placement\}/,
  );
  assert.match(combobox, /style=\{panelPosition\.style\}/);
  assert.match(
    comboboxCss,
    /\.ui-combobox__panel\[data-placement='top'\]/,
  );
});
