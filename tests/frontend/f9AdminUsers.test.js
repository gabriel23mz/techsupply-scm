import assert from 'node:assert/strict';
import {
  readFile,
} from 'node:fs/promises';
import test from 'node:test';

const readSource = (relativePath) =>
  readFile(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

test('F9 registra Usuarios como módulo exclusivo de ADMIN', async () => {
  const routes = await readSource(
    'frontend/src/shared/routing/routeRegistry.jsx',
  );
  const components = await readSource(
    'frontend/src/shared/routing/routeComponents.jsx',
  );
  const navigation = await readSource(
    'frontend/src/shared/constants/navigation.jsx',
  );

  assert.match(
    routes,
    /id: 'usuarios'[\s\S]*?path: '\/usuarios'[\s\S]*?permission: PERMISSIONS\.USUARIOS_GESTIONAR[\s\S]*?roles: \[ROLES\.ADMIN\][\s\S]*?element: <UsuariosPage \/>/,
  );
  assert.match(
    components,
    /modules\/usuarios\/pages\/UsuariosPage/,
  );
  assert.match(
    navigation,
    /id: 'administracion'[\s\S]*?label: 'Administración'[\s\S]*?'usuarios'/,
  );
});

test('F9 consume el CRUD backend vigente sin cambiar contratos', async () => {
  const service = await readSource(
    'frontend/src/modules/usuarios/services/usuarios.service.js',
  );

  assert.match(service, /api\.get\('\/usuarios'\)/);
  assert.match(service, /api\.get\(`\/usuarios\/\$\{id\}`\)/);
  assert.match(service, /api\.post\('\/usuarios', payload\)/);
  assert.match(service, /api\.put\(`\/usuarios\/\$\{id\}`, payload\)/);
  assert.match(service, /api\.delete\(`\/usuarios\/\$\{id\}`\)/);
});

test('F9 replica el patrón de Clientes para filtros, tabla y acciones administrativas', async () => {
  const page = await readSource(
    'frontend/src/modules/usuarios/pages/UsuariosPage.jsx',
  );
  const table = await readSource(
    'frontend/src/modules/usuarios/components/UsuariosTable.jsx',
  );
  const toolbar = await readSource(
    'frontend/src/modules/usuarios/components/UsuariosToolbar.jsx',
  );

  assert.match(page, /useSearchParams/);
  assert.match(page, /searchParams\.get\('q'\)/);
  assert.match(page, /searchParams\.get\('rol'\)/);
  assert.match(page, /searchParams\.get\('page'\)/);
  assert.match(page, /<UsuariosMetrics/);
  assert.match(page, /<UsuariosToolbar/);
  assert.match(page, /<UsuariosTable/);
  assert.match(page, /<Pagination/);
  assert.match(page, /<UsuarioFormModal/);
  assert.match(page, /<UsuarioDetailDrawer/);
  assert.match(page, /<ConfirmDialog/);
  assert.match(toolbar, /<SearchField/);
  assert.match(toolbar, /<Combobox/);
  assert.match(table, /<DataTable/);
  assert.match(table, /id: 'view'/);
  assert.match(table, /id: 'edit'/);
  assert.match(table, /id: 'delete'/);
});

test('F9 valida creación, edición, roles y restablecimiento administrativo de contraseña', async () => {
  const form = await readSource(
    'frontend/src/modules/usuarios/components/UsuarioFormModal.jsx',
  );
  const utils = await readSource(
    'frontend/src/modules/usuarios/usuario.utils.js',
  );

  for (const role of [
    'ROLES.ADMIN',
    'ROLES.VENTAS',
    'ROLES.BODEGA',
    'ROLES.LOGISTICA',
    'ROLES.CHOFER',
    'ROLES.COMPRAS',
  ]) {
    assert.match(utils, new RegExp(role.replace('.', '\\.')));
  }

  assert.match(form, /mode === 'create'/);
  assert.match(form, /formData\.password\.length < 6/);
  assert.match(form, /password_confirmation !== formData\.password/);
  assert.match(form, /mode === 'create' \|\| formData\.password/);
  assert.match(form, /payload\.password = formData\.password/);
  assert.match(form, /Déjala vacía para conservar la contraseña actual/);
  assert.match(form, /El perfil[\s\S]*licencia[\s\S]*módulo[\s\S]*Choferes/i);
  assert.doesNotMatch(form, /cambiar mi contraseña|\/auth\/password/i);
});

test('F9 mantiene identidad visual y responsive equivalente a Clientes', async () => {
  const css = await readSource(
    'frontend/src/modules/usuarios/usuarios.css',
  );
  const form = await readSource(
    'frontend/src/modules/usuarios/components/UsuarioFormModal.jsx',
  );

  assert.match(css, /\.users-metrics[\s\S]*?repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.users-data-table[\s\S]*?table-layout: fixed/);
  assert.match(css, /\.user-form-section[\s\S]*?grid-template-columns: minmax\(10\.5rem, 12rem\) minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 768px\)/);
  assert.match(css, /@media \(max-width: 576px\)/);
  assert.match(css, /\.user-form-grid > \.ui-form-field[\s\S]*?min-height:/);
  assert.match(form, /noValidate/);
  assert.match(form, /disabled=\{!isFormValid\}/);
  assert.doesNotMatch(form, /className="btn |alert\(|confirm\(/);
  assert.doesNotMatch(css, /font-size:\s*(7|8|9)px/);
});

test('F9 integra Usuarios en Dashboard, Ayuda y README', async () => {
  const dashboardAccess = await readSource(
    'frontend/src/shared/routing/dashboardAccess.js',
  );
  const roleExperience = await readSource(
    'frontend/src/shared/constants/roleExperience.js',
  );
  const frontendReadme = await readSource('frontend/README.md');
  const rootReadme = await readSource('README.md');

  assert.match(
    dashboardAccess,
    /USUARIOS:[\s\S]*?routeId: 'usuarios'/,
  );
  assert.match(
    dashboardAccess,
    /usuarios: '\/usuarios'/,
  );
  assert.match(
    roleExperience,
    /ROLES\.ADMIN[\s\S]*?modules:[\s\S]*?'usuarios'/,
  );
  assert.match(frontendReadme, /\/usuarios/);
  assert.match(frontendReadme, /Administración de usuarios/);
  assert.match(rootReadme, /Administración de usuarios exclusiva de ADMIN/);
});
