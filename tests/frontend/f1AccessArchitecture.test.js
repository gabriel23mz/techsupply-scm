import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  PERMISSIONS as BACKEND_PERMISSIONS,
  ROLES,
  getPermissionsForRole,
} from '../../src/constants/permissions.js';

import {
  canAccessDefinition,
  normalizePermissions,
} from '../../frontend/src/shared/routing/access.js';

import {
  PERMISSIONS as FRONTEND_PERMISSIONS,
} from '../../frontend/src/shared/constants/permissions.js';

const readSource = (relativePath) =>
  readFile(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

test('F1 mantiene sincronizados los contratos de permisos entre backend y frontend', () => {
  assert.deepEqual(
    Object.values(FRONTEND_PERMISSIONS).sort(),
    Object.values(BACKEND_PERMISSIONS).sort(),
  );
});

test('F1 normaliza permisos repetidos y evalúa permission, any, all y roles', () => {
  const permissions = normalizePermissions([
    BACKEND_PERMISSIONS.CLIENTES_LEER,
    BACKEND_PERMISSIONS.CLIENTES_LEER,
    null,
    '',
    BACKEND_PERMISSIONS.PEDIDOS_LEER,
  ]);

  assert.deepEqual(permissions, [
    BACKEND_PERMISSIONS.CLIENTES_LEER,
    BACKEND_PERMISSIONS.PEDIDOS_LEER,
  ]);

  assert.equal(
    canAccessDefinition({
      access: {
        permission: BACKEND_PERMISSIONS.CLIENTES_LEER,
        roles: [ROLES.LOGISTICA],
      },
      permissions,
      role: ROLES.LOGISTICA,
    }),
    true,
  );

  assert.equal(
    canAccessDefinition({
      access: {
        anyPermissions: [
          BACKEND_PERMISSIONS.JORNADAS_GENERAR,
          BACKEND_PERMISSIONS.CLIENTES_LEER,
        ],
      },
      permissions,
      role: ROLES.LOGISTICA,
    }),
    true,
  );

  assert.equal(
    canAccessDefinition({
      access: {
        allPermissions: [
          BACKEND_PERMISSIONS.CLIENTES_LEER,
          BACKEND_PERMISSIONS.UBICACIONES_GESTIONAR,
        ],
      },
      permissions,
      role: ROLES.LOGISTICA,
    }),
    false,
  );

  assert.equal(
    canAccessDefinition({
      access: {
        permission: BACKEND_PERMISSIONS.CLIENTES_LEER,
        roles: [ROLES.VENTAS],
      },
      permissions,
      role: ROLES.LOGISTICA,
    }),
    false,
  );
});

test('F1 permite un inicio autenticado para todos los roles y separa rutas de navegación', async () => {
  const routes = await readSource(
    'frontend/src/shared/routing/routeRegistry.jsx',
  );
  const navigation = await readSource(
    'frontend/src/shared/constants/navigation.jsx',
  );
  const router = await readSource(
    'frontend/src/app/Router.jsx',
  );

  assert.match(routes, /id: 'dashboard'[\s\S]*?path: '\/'/);
  assert.match(routes, /id: 'access-denied'[\s\S]*?path: '\/acceso-denegado'/);
  assert.match(routes, /id: 'not-found'[\s\S]*?path: '\*'/);
  assert.match(routes, /id: 'mis-entregas'[\s\S]*?ROLES\.CHOFER/);
  assert.match(routes, /id: 'despachos'[\s\S]*?ROLES\.ADMIN,[\s\S]*?ROLES\.LOGISTICA/);

  assert.match(navigation, /navigationSections/);
  assert.doesNotMatch(navigation, /element:/);
  assert.match(router, /routeRegistry\.map/);
  assert.match(router, /access=\{route\.access\}/);
});

test('F1 valida la sesión persistida con auth me y evita redirecciones duras desde Axios', async () => {
  const authContext = await readSource(
    'frontend/src/shared/contexts/AuthContext.jsx',
  );
  const authService = await readSource(
    'frontend/src/modules/auth/services/auth.service.js',
  );
  const api = await readSource(
    'frontend/src/shared/services/api.js',
  );

  assert.match(authService, /api\.get\([\s\S]*?'\/auth\/me'/);
  assert.match(authContext, /obtenerSesionActual/);
  assert.match(authContext, /isSessionLoading/);
  assert.match(api, /createApiError/);
  assert.match(api, /SESSION_EXPIRED_EVENT/);
  assert.doesNotMatch(api, /window\.location/);
});

test('F1 v2 filtra navegación y consume dashboard y notificaciones role-aware', async () => {
  const sidebar = await readSource(
    'frontend/src/shared/components/Sidebar.jsx',
  );
  const topbar = await readSource(
    'frontend/src/shared/components/Topbar.jsx',
  );
  const dashboardService = await readSource(
    'frontend/src/modules/dashboard/services/dashboard.service.js',
  );
  const dashboardPage = await readSource(
    'frontend/src/modules/dashboard/pages/DashboardPage.jsx',
  );

  assert.match(sidebar, /canAccess\(route\.access\)/);
  assert.match(dashboardService, /['"]\/dashboard\/resumen['"]/);
  assert.match(dashboardService, /['"]\/dashboard\/notificaciones['"]/);
  assert.match(topbar, /obtenerNotificacionesDashboard/);
  assert.doesNotMatch(topbar, /api\.get\(['"]\/pedidos/);
  assert.doesNotMatch(topbar, /api\.get\(['"]\/despachos/);
  assert.doesNotMatch(topbar, /api\.get\(['"]\/productos/);
  assert.match(dashboardPage, /obtenerResumenDashboard/);
  assert.doesNotMatch(dashboardPage, /failedSources/);
});

test('F1 oculta y protege acciones sensibles en los módulos actuales', async () => {
  const clients = await readSource(
    'frontend/src/modules/clientes/components/ClientesTable.jsx',
  );
  const orders = await readSource(
    'frontend/src/modules/pedidos/components/PedidosTable.jsx',
  );
  const locations = await readSource(
    'frontend/src/modules/ubicaciones/components/UbicacionesTable.jsx',
  );
  const routes = await readSource(
    'frontend/src/modules/rutas/components/catalogo/RutasTable.jsx',
  );
  const logistics = await readSource(
    'frontend/src/modules/logistica/components/LogisticsToolbar.jsx',
  );
  const journey = await readSource(
    'frontend/src/modules/logistica/pages/JornadaDetallePage.jsx',
  );

  assert.match(clients, /PERMISSIONS\.CLIENTES_GESTIONAR/);
  assert.match(orders, /PERMISSIONS\.PEDIDOS_EDITAR/);
  assert.match(orders, /PERMISSIONS\.PEDIDOS_CANCELAR/);
  assert.match(locations, /PERMISSIONS\.UBICACIONES_GESTIONAR/);
  assert.match(routes, /PERMISSIONS\.RUTAS_GESTIONAR/);
  assert.match(logistics, /PERMISSIONS\.JORNADAS_GENERAR/);
  assert.match(journey, /PERMISSIONS\.JORNADAS_INICIAR/);
  assert.match(journey, /PERMISSIONS\.JORNADAS_FINALIZAR/);
  assert.match(journey, /PERMISSIONS\.DESPACHOS_ENTREGAR/);
  assert.match(journey, /PERMISSIONS\.DESPACHOS_NO_ENTREGAR/);
});

test('F1 evita llamadas administrativas de usuarios en el flujo normal de Ventas', async () => {
  const ordersPage = await readSource(
    'frontend/src/modules/pedidos/pages/PedidosPage.jsx',
  );

  assert.match(
    ordersPage,
    /shouldLoadUsers = can\([\s\S]*?PERMISSIONS\.USUARIOS_GESTIONAR/,
  );
  assert.match(
    ordersPage,
    /shouldLoadUsers[\s\S]*?obtenerUsuarios\(\)[\s\S]*?Promise\.resolve\([\s\S]*?user \? \[user\] : \[\]/,
  );

  const ventas = getPermissionsForRole(ROLES.VENTAS);
  assert.ok(!ventas.includes(BACKEND_PERMISSIONS.USUARIOS_GESTIONAR));
});
