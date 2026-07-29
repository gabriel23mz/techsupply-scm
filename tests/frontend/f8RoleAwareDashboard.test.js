import assert from 'node:assert/strict';
import {
  access,
  readFile,
} from 'node:fs/promises';
import test from 'node:test';

const readSource = (relativePath) =>
  readFile(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

const exists = async (relativePath) => {
  try {
    await access(new URL(`../../${relativePath}`, import.meta.url));
    return true;
  } catch {
    return false;
  }
};

test('F8 compone un Dashboard específico para los seis roles sin tocar contratos backend', async () => {
  const page = await readSource(
    'frontend/src/modules/dashboard/pages/DashboardPage.jsx',
  );
  const roles = await readSource(
    'frontend/src/shared/constants/roleExperience.js',
  );
  const service = await readSource(
    'frontend/src/modules/dashboard/services/dashboard.service.js',
  );

  for (const role of [
    'ROLES.ADMIN',
    'ROLES.VENTAS',
    'ROLES.BODEGA',
    'ROLES.LOGISTICA',
    'ROLES.CHOFER',
    'ROLES.COMPRAS',
  ]) {
    assert.match(roles, new RegExp(`\\[${role.replace('.', '\\.')}\\]`));
  }

  assert.match(page, /getRoleExperience\(role\)/);
  assert.match(page, /role === ROLES\.CHOFER/);
  assert.match(page, /role === ROLES\.COMPRAS/);
  assert.match(page, /usePageHeader\(pageHeader\)/);
  assert.match(page, /<LoadingState/);
  assert.match(page, /<ErrorState/);
  assert.match(service, /api\.get\('\/dashboard\/resumen'\)/);
  assert.match(service, /api\.get\('\/dashboard\/notificaciones'/);
});

test('F8 mantiene una identidad visual compartida, responsive y sin Bootstrap directo', async () => {
  const page = await readSource(
    'frontend/src/modules/dashboard/pages/DashboardPage.jsx',
  );
  const css = await readSource(
    'frontend/src/modules/dashboard/dashboard.css',
  );
  const helpCss = await readSource(
    'frontend/src/modules/help/help.css',
  );

  assert.match(page, /Button,[\s\S]*?ErrorState,[\s\S]*?LoadingState/);
  assert.match(page, /MetricCard/);
  assert.match(css, /grid-template-columns: repeat\(12, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 576px\)/);
  assert.match(css, /\.dashboard-page--chofer/);
  assert.match(helpCss, /@media \(max-width: 576px\)/);
  assert.doesNotMatch(page, /className="btn |spinner-border/);
  assert.doesNotMatch(css, /font-size:\s*(7|8|9)px/);
  assert.doesNotMatch(helpCss, /font-size:\s*(7|8|9)px/);
});

test('F8 crea Centro de ayuda para todos los roles con pestañas persistidas en URL', async () => {
  const page = await readSource(
    'frontend/src/modules/help/pages/HelpCenterPage.jsx',
  );
  const navigation = await readSource(
    'frontend/src/shared/constants/navigation.jsx',
  );
  const routes = await readSource(
    'frontend/src/shared/routing/routeRegistry.jsx',
  );
  const components = await readSource(
    'frontend/src/shared/routing/routeComponents.jsx',
  );

  assert.match(navigation, /'dashboard',[\s\S]*?'help'/);
  assert.match(routes, /id: 'help'[\s\S]*?path: '\/ayuda'/);
  assert.match(routes, /element: <HelpCenterPage \/>/);
  assert.match(components, /modules\/help\/pages\/HelpCenterPage/);
  assert.match(page, /useSearchParams/);
  assert.match(page, /TAB_IDS\.SYSTEM/);
  assert.match(page, /TAB_IDS\.ROLE/);
  assert.match(page, /<Tabs/);
  assert.match(page, /experience\.responsibilities/);
  assert.match(page, /experience\.goodPractices/);
});

test('F8 presenta Compras como alcance informativo y evita enlaces vacíos', async () => {
  const roles = await readSource(
    'frontend/src/shared/constants/roleExperience.js',
  );
  const accessConfig = await readSource(
    'frontend/src/shared/routing/dashboardAccess.js',
  );
  const scope = await readSource(
    'frontend/src/modules/dashboard/components/ScopeNotice.jsx',
  );

  assert.match(roles, /ROLES\.COMPRAS[\s\S]*?modules: \[\]/);
  assert.match(roles, /dominio Inbound/);
  assert.match(accessConfig, /PRODUCTOS:[\s\S]*?routeId: 'help'[\s\S]*?informational: true/);
  assert.match(accessConfig, /CATEGORIAS:[\s\S]*?routeId: 'help'[\s\S]*?informational: true/);
  assert.match(accessConfig, /USUARIOS:[\s\S]*?routeId: 'usuarios'/);
  assert.match(scope, /\/ayuda\?tab=rol/);
});

test('F8 sincroniza accesos y notificaciones con las rutas cerradas actuales', async () => {
  const accessConfig = await readSource(
    'frontend/src/shared/routing/dashboardAccess.js',
  );

  assert.match(accessConfig, /JORNADAS:[\s\S]*?routeId: 'jornadas'/);
  assert.match(accessConfig, /CAMIONES:[\s\S]*?routeId: 'camiones'/);
  assert.match(accessConfig, /CHOFERES:[\s\S]*?routeId: 'choferes'/);
  assert.match(accessConfig, /MI_JORNADA:[\s\S]*?routeId: 'mi-jornada'/);
  assert.match(accessConfig, /return `\/jornadas\/\$\{entityId\}`/);
  assert.match(accessConfig, /return '\/mi-jornada'/);
  assert.doesNotMatch(accessConfig, /routeId: 'centro-logistico'/);
  assert.doesNotMatch(accessConfig, /routeId: 'mis-entregas'/);
});

test('F8 limpia los componentes muertos del Dashboard anterior', async () => {
  assert.equal(
    await exists('frontend/src/modules/dashboard/components/OperationalStatus.jsx'),
    false,
  );
  assert.equal(
    await exists('frontend/src/modules/dashboard/components/RecentActivity.jsx'),
    false,
  );

  const css = await readSource(
    'frontend/src/modules/dashboard/dashboard.css',
  );

  assert.doesNotMatch(css, /dashboard-operation-grid/);
  assert.doesNotMatch(css, /dashboard-activity-list/);
  assert.doesNotMatch(css, /dashboard-welcome/);
});


test('F8.1 aprovecha el espacio del Dashboard sin repetir información de la sesión', async () => {
  const page = await readSource(
    'frontend/src/modules/dashboard/pages/DashboardPage.jsx',
  );
  const overview = await readSource(
    'frontend/src/modules/dashboard/components/RoleOverview.jsx',
  );
  const css = await readSource(
    'frontend/src/modules/dashboard/dashboard.css',
  );

  assert.match(page, /data-count=\{metrics\.length\}/);
  assert.match(page, /dashboard-main-stack[\s\S]*?<DashboardAlerts[\s\S]*?<DashboardContext/);
  assert.match(page, /dashboard-main-stack[\s\S]*?dashboard-accesses/);
  assert.doesNotMatch(page, /dashboard-updated-at|actualizado_en/);
  assert.doesNotMatch(overview, /Sesión actual|userName|roleLabel/);

  assert.match(css, /dashboard-metrics-grid\[data-count='5'\][\s\S]*?nth-child\(-n \+ 3\)[\s\S]*?span 4/);
  assert.match(css, /dashboard-metrics-grid\[data-count='5'\][\s\S]*?nth-child\(n \+ 4\)[\s\S]*?span 6/);
  assert.match(css, /dashboard-metrics-grid\[data-count='6'\][\s\S]*?span 4/);
  assert.match(page, /balanceMainGrid = quickAccess\.length > 4 \|\| alerts\.length > 2/);
  assert.match(css, /dashboard-main-grid--balanced[\s\S]*?height: clamp\(/);
  assert.match(css, /dashboard-main-grid--balanced[\s\S]*?dashboard-accesses__grid[\s\S]*?overflow-y: auto/);
  assert.doesNotMatch(css, /dashboard-role-overview__session|dashboard-updated-at/);
});

test('F8.1 distribuye horizontalmente la introducción del Centro de ayuda', async () => {
  const page = await readSource(
    'frontend/src/modules/help/pages/HelpCenterPage.jsx',
  );
  const css = await readSource(
    'frontend/src/modules/help/help.css',
  );

  assert.match(page, /help-intro__heading[\s\S]*?help-intro__description/);
  assert.match(page, /help-role-card__copy[\s\S]*?help-role-card__description/);
  assert.match(css, /\.help-intro::after,[\s\S]*?\.help-role-card::after/);
  assert.match(css, /grid-template-columns: auto minmax\(18rem, 0\.9fr\) minmax\(22rem, 1\.1fr\)/);
  assert.match(css, /help-intro__description,[\s\S]*?border-left: 1px solid/);
});

test('F8.2 alinea el banner del Dashboard con Ayuda y amplía los paneles operativos', async () => {
  const overview = await readSource(
    'frontend/src/modules/dashboard/components/RoleOverview.jsx',
  );
  const css = await readSource(
    'frontend/src/modules/dashboard/dashboard.css',
  );

  assert.match(
    overview,
    /dashboard-role-overview__heading[\s\S]*?dashboard-role-overview__description/,
  );
  assert.match(
    css,
    /grid-template-columns: auto minmax\(18rem, 0\.9fr\) minmax\(22rem, 1\.1fr\)/,
  );
  assert.match(
    css,
    /dashboard-role-overview__description[\s\S]*?border-left: 1px solid/,
  );
  assert.match(
    css,
    /dashboard-main-grid--balanced[\s\S]*?height: clamp\(36rem, 68vh, 44rem\)/,
  );
});
