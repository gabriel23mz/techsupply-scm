import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('F5.1.6 conserva las tres acciones visibles y alineadas en móvil', () => {
  const table = read(
    'frontend/src/modules/clientes/components/ClientesTable.jsx',
  );
  const tableStyles = read(
    'frontend/src/shared/ui/DataTable/DataTable.css',
  );

  assert.match(table, /icon:\s*['"]bi bi-eye['"]/);
  assert.match(table, /icon:\s*['"]bi bi-pencil-square['"]/);
  assert.match(table, /icon:\s*['"]bi bi-slash-circle['"]/);
  assert.match(
    tableStyles,
    /div\.ui-data-table \.ui-data-table__actions-cell \{[\s\S]*?width:\s*100%/,
  );
  assert.match(
    tableStyles,
    /\.ui-data-table__actions-cell \.ui-table-actions \{[\s\S]*?justify-self:\s*end/,
  );
});

test('F5.1.6 mantiene una separación visual mínima en Combobox', () => {
  const source = read(
    'frontend/src/shared/ui/Combobox/Combobox.jsx',
  );

  assert.match(source, /const panelGap = 5;/);
});

test('F5.1.6 convierte la hamburguesa en cierre y permite alternar el drawer', () => {
  const topbar = read(
    'frontend/src/shared/components/Topbar.jsx',
  );
  const layout = read(
    'frontend/src/shared/layouts/MainLayout.jsx',
  );
  const sidebar = read(
    'frontend/src/shared/components/Sidebar.jsx',
  );

  assert.match(topbar, /navigationOpen = false/);
  assert.match(topbar, /aria-expanded=\{navigationOpen\}/);
  assert.match(topbar, /navigationOpen[\s\S]*?'bi-x-lg'[\s\S]*?'bi-list'/);
  assert.match(layout, /setMobileSidebarOpen\(\(current\) => !current\)/);
  assert.match(sidebar, /id=['"]app-sidebar['"]/);
});

test('F5.1.6 conserva el contenedor visible del login en teléfonos', () => {
  const styles = read(
    'frontend/src/modules/auth/auth.css',
  );

  assert.match(
    styles,
    /@media \(max-width: 520px\)[\s\S]*?\.auth-form-panel\s*\{[\s\S]*?padding:\s*0\.75rem/,
  );
  assert.match(
    styles,
    /@media \(max-width: 520px\)[\s\S]*?\.auth-card\s*\{[\s\S]*?max-height:\s*calc\(100dvh - 1\.5rem\)[\s\S]*?border-radius:\s*var\(--radius-xl\)/,
  );
});

test('F5.1.6 mejora contraste y armonía del login', () => {
  const styles = read(
    'frontend/src/modules/auth/auth.css',
  );

  assert.match(styles, /--auth-placeholder:\s*#71839b/);
  assert.match(
    styles,
    /html\[data-theme=['"]dark['"]\] \.auth-page\s*\{[\s\S]*?--auth-placeholder:\s*#a9b8cc/,
  );
  assert.match(
    styles,
    /\.auth-input input::placeholder\s*\{[\s\S]*?color:\s*var\(--auth-placeholder\)[\s\S]*?opacity:\s*1/,
  );
  assert.match(styles, /#10234f[\s\S]*?#1b4b82[\s\S]*?#245f9d/);
});

test('F5.1.7 alinea el acceso seguro con el título y la marca móvil', () => {
  const page = read(
    'frontend/src/modules/auth/pages/LoginPage.jsx',
  );
  const styles = read(
    'frontend/src/modules/auth/auth.css',
  );

  assert.match(
    page,
    /auth-mobile-brand[\s\S]*?<h2>Iniciar sesión<\/h2>[\s\S]*?auth-card-kicker/,
  );
  assert.match(
    styles,
    /\.auth-card-header\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) auto/,
  );
  assert.match(
    styles,
    /\.auth-card-kicker\s*\{[\s\S]*?grid-column:\s*2[\s\S]*?justify-self:\s*end/,
  );
  assert.match(
    styles,
    /@media \(max-width: 920px\)[\s\S]*?\.auth-mobile-brand\s*\{[\s\S]*?grid-column:\s*1[\s\S]*?margin:\s*0/,
  );
  assert.match(
    styles,
    /@media \(max-width: 920px\)[\s\S]*?\.auth-card h2\s*\{[\s\S]*?grid-column:\s*1 \/ -1[\s\S]*?grid-row:\s*2/,
  );
});
