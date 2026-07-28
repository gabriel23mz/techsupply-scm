import assert from 'node:assert/strict';
import {
  access,
  readdir,
  readFile,
} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = new URL('../../', import.meta.url);

const readSource = (relativePath) =>
  readFile(new URL(relativePath, projectRoot), 'utf8');

async function readClientSources(relativeDirectory = 'frontend/src/modules/clientes') {
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
        ...(await readClientSources(relativePath)),
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

test('F5.1 elimina el banner redundante y reserva la Topbar como encabezado único', async () => {
  const page = await readSource(
    'frontend/src/modules/clientes/pages/ClientesPage.jsx',
  );

  assert.doesNotMatch(page, /ClientesBanner/);
  assert.match(page, /usePageHeader/);
  assert.match(page, /title: 'Clientes'/);
  assert.match(page, /topbar-page-action--refresh/);
  assert.match(page, /topbar-page-action--primary/);

  await assert.rejects(
    access(
      new URL(
        'frontend/src/modules/clientes/components/ClientesBanner.jsx',
        projectRoot,
      ),
    ),
  );
});

test('F5.1 conserva búsqueda, ubicación y página en la URL', async () => {
  const page = await readSource(
    'frontend/src/modules/clientes/pages/ClientesPage.jsx',
  );

  assert.match(page, /useSearchParams/);
  assert.match(page, /searchParams\.get\('q'\)/);
  assert.match(page, /searchParams\.get\('ubicacion'\)/);
  assert.match(page, /searchParams\.get\('page'\)/);
  assert.match(page, /setSearchParams\(nextParams/);
  assert.doesNotMatch(page, /BODEGA_CENTRAL_ID/);
});

test('F5.1 migra Clientes a la biblioteca UI compartida', async () => {
  const table = await readSource(
    'frontend/src/modules/clientes/components/ClientesTable.jsx',
  );
  const modal = await readSource(
    'frontend/src/modules/clientes/components/ClienteFormModal.jsx',
  );
  const drawer = await readSource(
    'frontend/src/modules/clientes/components/ClienteDetailDrawer.jsx',
  );
  const metrics = await readSource(
    'frontend/src/modules/clientes/components/ClientesMetrics.jsx',
  );

  assert.match(table, /DataTable/);
  assert.match(table, /StatusBadge/);
  assert.match(modal, /Modal/);
  assert.match(modal, /TextField/);
  assert.match(modal, /Combobox/);
  assert.match(drawer, /Drawer/);
  assert.match(drawer, /StatusBadge/);
  assert.match(metrics, /StatCard/);
});

test('F5.1 elimina controles Bootstrap directos del módulo Clientes', async () => {
  const sources = await readClientSources();

  for (const file of sources) {
    assert.doesNotMatch(
      file.source,
      /className=["'`][^"'`]*\bbtn\b/,
      file.path,
    );
    assert.doesNotMatch(
      file.source,
      /className=["'`][^"'`]*\bform-control\b/,
      file.path,
    );
    assert.doesNotMatch(
      file.source,
      /<select\b/,
      file.path,
    );
  }
});

test('F5.1 mantiene gestión para ADMIN y VENTAS y lectura para LOGISTICA', async () => {
  const page = await readSource(
    'frontend/src/modules/clientes/pages/ClientesPage.jsx',
  );
  const table = await readSource(
    'frontend/src/modules/clientes/components/ClientesTable.jsx',
  );

  assert.match(page, /PERMISSIONS\.CLIENTES_GESTIONAR/);
  assert.match(page, /canManageClients/);
  assert.match(table, /PERMISSIONS\.CLIENTES_GESTIONAR/);
  assert.match(table, /visible: canManage/);
  assert.match(page, /Consulta del directorio comercial/);
});

test('F5.1 incorpora acciones dinámicas de página en la Topbar', async () => {
  const providers = await readSource(
    'frontend/src/app/providers.jsx',
  );
  const topbar = await readSource(
    'frontend/src/shared/components/Topbar.jsx',
  );
  const provider = await readSource(
    'frontend/src/shared/contexts/PageHeaderContext.jsx',
  );
  const hook = await readSource(
    'frontend/src/shared/hooks/usePageHeader.js',
  );

  assert.match(providers, /PageHeaderProvider/);
  assert.match(topbar, /pageHeader\?\.actions/);
  assert.match(topbar, /topbar-page-actions/);
  assert.match(provider, /registerPageHeader/);
  assert.match(hook, /registerPageHeader\(config\)/);
});


test('F5.1.1 evita que la fila completa intercepte la navegación del puntero', async () => {
  const table = await readSource(
    'frontend/src/modules/clientes/components/ClientesTable.jsx',
  );

  assert.doesNotMatch(table, /onRowClick=\{onView\}/);
  assert.match(table, /id: 'view'/);
  assert.match(table, /onClick: \(\) => onView\(cliente\)/);
});

test('F5.1.1 estabiliza la altura de filas y distribuye mejor las columnas', async () => {
  const table = await readSource(
    'frontend/src/modules/clientes/components/ClientesTable.jsx',
  );
  const css = await readSource(
    'frontend/src/modules/clientes/clientes.css',
  );

  assert.match(table, /width: '20%'/);
  assert.match(table, /width: '11%'/);
  assert.match(css, /table-layout: fixed/);
  assert.match(css, /height: 4\.85rem/);
  assert.match(css, /min-height: 2\.7em/);
  assert.match(css, /overflow-wrap: anywhere/);
});

test('F5.1.1 mantiene cinco posiciones estables entre las flechas de paginación', async () => {
  const pagination = await readSource(
    'frontend/src/shared/ui/Pagination/Pagination.jsx',
  );
  const css = await readSource(
    'frontend/src/shared/ui/Pagination/Pagination.css',
  );

  assert.match(pagination, /const MAX_VISIBLE_ITEMS = 5/);
  assert.match(pagination, /buildPaginationItems/);
  assert.match(pagination, /padPaginationItems/);
  assert.match(pagination, /'ellipsis-start'/);
  assert.match(pagination, /'ellipsis-end'/);
  assert.match(css, /grid-template-columns: repeat\(/);
  assert.match(css, /5,\s*var\(--control-height-sm\)/);
  assert.match(css, /flex: 0 0 var\(--control-height-sm\)/);
});


test('F5.1.2 mantiene visibles y alineadas las acciones de tabla', async () => {
  const actionsCss = await readSource(
    'frontend/src/shared/ui/TableActions/TableActions.css',
  );

  assert.match(actionsCss, /grid-auto-columns: var\(--control-height-sm\)/);
  assert.match(actionsCss, /opacity: 1/);
  assert.match(actionsCss, /pointer-events: auto/);
  assert.doesNotMatch(actionsCss, /tr:not\(:hover\)/);
});

test('F5.1.2 ajusta Clientes al ancho disponible sin desplazamiento horizontal', async () => {
  const css = await readSource(
    'frontend/src/modules/clientes/clientes.css',
  );

  assert.match(css, /overflow: visible/);
  assert.match(css, /min-width: 0/);
  assert.match(css, /width: 7\.5rem/);
  assert.doesNotMatch(css, /min-width: 68rem/);
  assert.doesNotMatch(css, /min-width: 67rem/);
});

test('F5.1.2 compacta la identidad del cliente sin perder el código visual', async () => {
  const table = await readSource(
    'frontend/src/modules/clientes/components/ClientesTable.jsx',
  );
  const css = await readSource(
    'frontend/src/modules/clientes/clientes.css',
  );

  assert.doesNotMatch(table, /clients-name-cell__icon/);
  assert.match(table, /<small>/);
  assert.match(table, /bi bi-person/);
  assert.match(table, /formatClientCode\(cliente\.id\)/);
  assert.match(css, /clients-name-cell small i/);
});

test('F5.1.3 muestra el encabezado de acciones y conserva margen contra el borde', async () => {
  const table = await readSource(
    'frontend/src/shared/ui/DataTable/DataTable.jsx',
  );
  const css = await readSource(
    'frontend/src/modules/clientes/clientes.css',
  );

  assert.match(table, /actionsLabel = 'Acciones'/);
  assert.match(table, /\{actionsLabel\}/);
  assert.doesNotMatch(
    table,
    /<span className="visually-hidden">\s*Acciones\s*<\/span>/,
  );
  assert.match(css, /width: 7\.5rem/);
  assert.match(css, /ui-data-table__actions-heading \{\s*text-align: center/);
});

test('F5.1.4 elimina el scroll interno y centra las acciones en su columna', async () => {
  const css = await readSource(
    'frontend/src/modules/clientes/clientes.css',
  );

  assert.match(
    css,
    /clients-data-table \.ui-data-table__scroll \{\s*overflow: visible/,
  );
  assert.doesNotMatch(css, /overflow-x: hidden/);
  assert.match(css, /width: 7\.5rem;\s*padding-inline: 0\.35rem/);
  assert.match(
    css,
    /ui-table-actions \{\s*width: 100%;\s*justify-content: center/,
  );
});

test('F5.1.6 conserva visibles y alineadas las acciones en móvil', async () => {
  const table = await readSource(
    'frontend/src/modules/clientes/components/ClientesTable.jsx',
  );
  const css = await readSource(
    'frontend/src/modules/clientes/clientes.css',
  );
  const tableCss = await readSource(
    'frontend/src/shared/ui/DataTable/DataTable.css',
  );

  assert.match(table, /cellClassName: 'clients-status-cell'/);
  assert.match(
    css,
    /clients-metrics \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/,
  );
  assert.match(css, /clients-metrics > :last-child \{\s*grid-column: 1 \/ -1/);
  assert.match(
    tableCss,
    /\.ui-data-table__cell-content > \.ui-status-badge \{\s*justify-self: end/,
  );
  assert.match(
    tableCss,
    /ui-data-table__actions-cell \.ui-table-actions \{[\s\S]*width: max-content;[\s\S]*justify-self: end;[\s\S]*justify-content: end/,
  );
});

test('F5.1.5 aprovecha el ancho del modal y conserva margen en móvil', async () => {
  const css = await readSource(
    'frontend/src/modules/clientes/clientes.css',
  );

  assert.match(
    css,
    /client-form-section \{[\s\S]*grid-template-columns: minmax\(10\.5rem, 12rem\) minmax\(0, 1fr\)/,
  );
  assert.match(css, /client-form-modal\.ui-modal \{\s*max-height: min\(88vh, 46rem\)/);
  assert.match(
    css,
    /width: calc\(100% - 1\.25rem\);\s*max-height: calc\(100dvh - 1\.25rem\)/,
  );
  assert.match(css, /border-radius: var\(--radius-xl\)/);
});

test('F5.1.5 reemplaza la validación nativa por retroalimentación dinámica', async () => {
  const modal = await readSource(
    'frontend/src/modules/clientes/components/ClienteFormModal.jsx',
  );
  const formField = await readSource(
    'frontend/src/shared/ui/FormField/FormField.jsx',
  );

  assert.match(modal, /noValidate/);
  assert.match(modal, /const \[touched, setTouched\]/);
  assert.match(modal, /validateClientForm/);
  assert.match(modal, /disabled=\{!isFormValid\}/);
  assert.match(modal, /success:\s*touched\[field\]/);
  assert.match(formField, /ui-form-field__success/);
  assert.match(formField, /\{control\}[\s\S]*\{error \?/);
});

test('F5.1.5 muestra el Combobox por encima del modal', async () => {
  const variables = await readSource(
    'frontend/src/shared/styles/variables.css',
  );
  const comboboxCss = await readSource(
    'frontend/src/shared/ui/Combobox/Combobox.css',
  );

  assert.match(variables, /--z-modal: 1400;\s*--z-popover: 1500;\s*--z-toast: 1600;/);
  assert.match(comboboxCss, /z-index: var\(--z-popover\)/);
});
