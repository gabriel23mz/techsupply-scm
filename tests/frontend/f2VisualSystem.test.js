import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (relativePath) =>
  readFile(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

test('F2 define tokens semánticos y temas claro/oscuro', async () => {
  const variables = await readSource(
    'frontend/src/shared/styles/variables.css',
  );
  const preferences = await readSource(
    'frontend/src/shared/contexts/PreferencesContext.jsx',
  );

  assert.match(variables, /--color-surface-elevated:/);
  assert.match(variables, /--z-modal:/);
  assert.match(variables, /--z-toast:/);
  assert.match(variables, /html\[data-theme='dark'\]/);
  assert.match(preferences, /theme: 'system'/);
  assert.match(preferences, /resolvedTheme/);
  assert.match(preferences, /root\.dataset\.theme = resolvedTheme/);
});


test('F2 aplica el tema antes de montar React para evitar parpadeos', async () => {
  const html = await readSource('frontend/index.html');

  assert.match(html, /techsupply_preferences/);
  assert.match(html, /document\.documentElement\.dataset\.theme = theme/);
  assert.match(html, /meta[\s\S]*?name="theme-color"/);
});

test('F2 incorpora navegación móvil accesible y layout adaptable', async () => {
  const layout = await readSource(
    'frontend/src/shared/layouts/MainLayout.jsx',
  );
  const sidebar = await readSource(
    'frontend/src/shared/components/Sidebar.jsx',
  );
  const topbar = await readSource(
    'frontend/src/shared/components/Topbar.jsx',
  );
  const shell = await readSource(
    'frontend/src/shared/layouts/app-shell.css',
  );

  assert.match(layout, /mobileSidebarOpen/);
  assert.match(layout, /sidebar-mobile-overlay/);
  assert.match(layout, /id="main-content"/);
  assert.match(sidebar, /mobileOpen/);
  assert.match(sidebar, /sidebar-mobile-close/);
  assert.match(topbar, /topbar-menu-button/);
  assert.match(shell, /@media \(max-width: 960px\)/);
  assert.match(shell, /\.app-sidebar\.mobile-open/);
});

test('F2 carga pantallas por demanda mediante React lazy y Suspense', async () => {
  const router = await readSource(
    'frontend/src/app/Router.jsx',
  );
  const registry = await readSource(
    'frontend/src/shared/routing/routeRegistry.jsx',
  );
  const routeComponents = await readSource(
    'frontend/src/shared/routing/routeComponents.jsx',
  );

  assert.match(router, /Suspense/);
  assert.match(router, /lazy\(\(\) =>/);
  assert.match(router, /RouteLoadingScreen/);
  assert.match(registry, /from '\.\/routeComponents'/);
  assert.match(routeComponents, /export const DashboardPage = lazy/);
  assert.match(
    routeComponents,
    /import\('\.\.\/\.\.\/modules\/rutas\/pages\/RutasPage'\)/,
  );
  assert.doesNotMatch(
    registry,
    /const DashboardPage = lazy/,
  );
});

test('F2 centraliza overlays y controles de mapa en tokens de capa', async () => {
  const shell = await readSource(
    'frontend/src/shared/layouts/app-shell.css',
  );
  const confirm = await readSource(
    'frontend/src/shared/components/ConfirmDialog/ConfirmDialog.css',
  );
  const routes = await readSource(
    'frontend/src/modules/rutas/rutas.css',
  );

  assert.match(shell, /z-index: var\(--z-modal\)/);
  assert.match(confirm, /z-index: var\(--z-modal\)/);
  assert.match(routes, /z-index: var\(--z-map\)/);
  assert.match(routes, /var\(--map-control-background\)/);
});

test('F2.3 integra un colapso compacto y profesional en la marca del sidebar', async () => {
  const topbar = await readSource(
    'frontend/src/shared/components/Topbar.jsx',
  );
  const sidebar = await readSource(
    'frontend/src/shared/components/Sidebar.jsx',
  );
  const shell = await readSource(
    'frontend/src/shared/layouts/app-shell.css',
  );
  const variables = await readSource(
    'frontend/src/shared/styles/variables.css',
  );

  assert.match(
    topbar,
    /<div className="topbar-route">[\s\S]*?<h2>\{currentRoute\.label\}<\/h2>[\s\S]*?<p>\{currentRoute\.description\}<\/p>/,
  );
  assert.doesNotMatch(topbar, /Módulo Outbound/);
  assert.match(
    sidebar,
    /<div className="sidebar-brand">[\s\S]*?className="sidebar-collapse-button"[\s\S]*?className="sidebar-mobile-close"/,
  );
  assert.match(sidebar, /bi-layout-sidebar-inset-reverse/);
  assert.match(sidebar, /bi-layout-sidebar-inset/);
  assert.doesNotMatch(sidebar, /sidebar-collapse-area/);
  assert.doesNotMatch(sidebar, /Contraer menú|Expandir menú/);
  assert.match(variables, /--topbar-background:/);
  assert.match(variables, /--topbar-control-background:/);
  assert.match(shell, /var\(--topbar-background\)/);
  assert.match(shell, /var\(--topbar-text-secondary\)/);
  assert.doesNotMatch(shell, /right:\s*-15px/);
  assert.doesNotMatch(
    shell,
    /\.topbar-route p\s*\{[^}]*display:\s*none;/,
  );
});

test('F2.4 mantiene legible el texto seleccionado en ambos temas', async () => {
  const variables = await readSource(
    'frontend/src/shared/styles/variables.css',
  );
  const global = await readSource(
    'frontend/src/shared/styles/global.css',
  );

  assert.match(variables, /--selection-background:\s*#2563eb/);
  assert.match(variables, /--selection-text:\s*#ffffff/);
  assert.match(
    variables,
    /html\[data-theme='dark'\][\s\S]*?--selection-background:\s*#1d4ed8/,
  );
  assert.match(
    global,
    /::selection\s*\{[\s\S]*?var\(--selection-background\)/,
  );
  assert.match(global, /color:\s*var\(--selection-text\)/);
  assert.doesNotMatch(
    global,
    /::selection\s*\{[^}]*color:\s*var\(--color-text\)/,
  );
});
