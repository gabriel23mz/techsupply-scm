import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  PERMISSIONS,
  ROLES,
  getPermissionsForRole,
  isAdmin,
} from '../../src/constants/permissions.js';

const readSource = (relativePath) =>
  readFile(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

test('F0 corrige la gestión de ubicaciones por rol', () => {
  const ventas = getPermissionsForRole(ROLES.VENTAS);
  const logistica = getPermissionsForRole(ROLES.LOGISTICA);

  assert.ok(ventas.includes(PERMISSIONS.UBICACIONES_LEER));
  assert.ok(!ventas.includes(PERMISSIONS.UBICACIONES_GESTIONAR));
  assert.ok(logistica.includes(PERMISSIONS.UBICACIONES_LEER));
  assert.ok(logistica.includes(PERMISSIONS.UBICACIONES_GESTIONAR));
});

test('F0 restringe Bodega a preparación, carga y catálogo', () => {
  const bodega = getPermissionsForRole(ROLES.BODEGA);

  assert.ok(!bodega.includes(PERMISSIONS.CLIENTES_LEER));
  assert.ok(!bodega.includes(PERMISSIONS.PEDIDOS_LEER));
  assert.ok(!bodega.includes(PERMISSIONS.CAMIONES_LEER));
  assert.ok(bodega.includes(PERMISSIONS.PEDIDOS_PREPARAR));
  assert.ok(bodega.includes(PERMISSIONS.CARGAS_LEER));
});

test('F0 separa el perfil propio del directorio global de choferes', () => {
  const chofer = getPermissionsForRole(ROLES.CHOFER);
  const logistica = getPermissionsForRole(ROLES.LOGISTICA);

  assert.ok(chofer.includes(PERMISSIONS.CHOFER_PERFIL_PROPIO_LEER));
  assert.ok(!chofer.includes(PERMISSIONS.CHOFERES_LEER));
  assert.ok(logistica.includes(PERMISSIONS.CHOFERES_LEER));
});

test('F0 reserva el mapa general para Logística y ADMIN', () => {
  const logistica = getPermissionsForRole(ROLES.LOGISTICA);
  const chofer = getPermissionsForRole(ROLES.CHOFER);

  assert.ok(logistica.includes(PERMISSIONS.JORNADAS_MAPA_GENERAL));
  assert.ok(!chofer.includes(PERMISSIONS.JORNADAS_MAPA_GENERAL));
});

test('isAdmin no considera privilegiado a un usuario ausente', () => {
  assert.equal(isAdmin(undefined), false);
  assert.equal(isAdmin(null), false);
  assert.equal(isAdmin({ rol: ROLES.ADMIN }), true);
});

test('los controladores de lectura pasan el usuario autenticado a los servicios', async () => {
  const despachoController = await readSource(
    'src/controllers/despacho.controller.js',
  );
  const jornadaController = await readSource(
    'src/controllers/jornadaReparto.controller.js',
  );

  assert.match(
    despachoController,
    /despachoService\.obtenerTodos\(req\.user\)/,
  );
  assert.match(
    despachoController,
    /despachoService\.obtenerPorId\([\s\S]*?req\.params\.id,[\s\S]*?req\.user/,
  );
  assert.match(
    jornadaController,
    /jornadaRepartoService\.obtenerMapaGeneral\([\s\S]*?req\.user/,
  );
  assert.match(
    jornadaController,
    /jornadaRepartoService\.avanzarJornada\([\s\S]*?req\.params\.id,[\s\S]*?req\.user/,
  );
});

test('las rutas F0 usan permisos específicos y exponen el perfil propio', async () => {
  const choferRoutes = await readSource(
    'src/routes/chofer.routes.js',
  );
  const jornadaRoutes = await readSource(
    'src/routes/jornadaReparto.routes.js',
  );

  assert.match(choferRoutes, /'\/me'/);
  assert.match(choferRoutes, /PERMISSIONS\.CHOFER_PERFIL_PROPIO_LEER/);
  assert.match(
    choferRoutes,
    /'\/disponibles'[\s\S]*?PERMISSIONS\.JORNADAS_ASIGNAR_CHOFER/,
  );
  assert.match(
    jornadaRoutes,
    /'\/mapa-general'[\s\S]*?PERMISSIONS\.JORNADAS_MAPA_GENERAL/,
  );

  assert.ok(
    choferRoutes.indexOf("'/me'") < choferRoutes.indexOf("'/:id'"),
    'La ruta /me debe declararse antes de /:id',
  );
});
