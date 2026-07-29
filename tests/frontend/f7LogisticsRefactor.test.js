import assert from 'node:assert/strict';
import {
  access,
  readFile,
} from 'node:fs/promises';
import test from 'node:test';

const projectRoot = new URL('../../', import.meta.url);

const readSource = (relativePath) =>
  readFile(new URL(relativePath, projectRoot), 'utf8');

const assertMissing = async (relativePath) => {
  await assert.rejects(
    access(new URL(relativePath, projectRoot)),
    `${relativePath} debe eliminarse después de la migración`,
  );
};

test('F7A registra Jornadas y Camiones como módulos logísticos propios', async () => {
  const registry = await readSource(
    'frontend/src/shared/routing/routeRegistry.jsx',
  );
  const navigation = await readSource(
    'frontend/src/shared/constants/navigation.jsx',
  );
  const components = await readSource(
    'frontend/src/shared/routing/routeComponents.jsx',
  );

  assert.match(registry, /id: 'jornadas'[\s\S]*?path: '\/jornadas'[\s\S]*?PERMISSIONS\.JORNADAS_LEER/);
  assert.match(registry, /id: 'camiones'[\s\S]*?path: '\/camiones'[\s\S]*?PERMISSIONS\.CAMIONES_LEER/);
  assert.match(registry, /path: '\/jornadas\/:id'/);
  assert.match(registry, /legacy-centro-logistico/);
  assert.match(navigation, /'jornadas',[\s\S]*?'despachos',[\s\S]*?'camiones',[\s\S]*?'rutas',[\s\S]*?'ubicaciones'/);
  assert.match(components, /modules\/logistica\/pages\/JornadasPage/);
  assert.match(components, /modules\/camiones\/pages\/CamionesPage/);
});

test('F7A conserva las pestañas de Jornadas en URL y separa el mapa operativo', async () => {
  const page = await readSource(
    'frontend/src/modules/logistica/pages/JornadasPage.jsx',
  );
  const routesPage = await readSource(
    'frontend/src/modules/rutas/pages/RutasPage.jsx',
  );

  assert.match(page, /useSearchParams/);
  assert.match(page, /planificacion/);
  assert.match(page, /listado/);
  assert.match(page, /mapa/);
  assert.match(page, /PERMISSIONS\.JORNADAS_MAPA_GENERAL/);
  const mapCard = await readSource(
    'frontend/src/modules/logistica/components/mapa/JornadaMapaCard.jsx',
  );

  assert.match(page, /components\/mapa\/MapaGeneralJornadas/);
  assert.match(page, /jornadas-mapa\.css/);
  assert.doesNotMatch(page, /rutas\/rutas\.css/);
  assert.doesNotMatch(routesPage, /RutasTabs|CamionesTab|MapaGeneralJornadas/);
  assert.doesNotMatch(mapCard, /btn btn-|btn-primary|btn-sm/);
  assert.match(mapCard, /Button/);
  assert.match(mapCard, /StatusBadge/);
});

test('F7A liga la carga de generación a la respuesta real y refresca sin bloquear', async () => {
  const page = await readSource(
    'frontend/src/modules/logistica/pages/JornadasPage.jsx',
  );
  const loading = await readSource(
    'frontend/src/modules/logistica/components/GeneracionLoadingModal.jsx',
  );
  const service = await readSource(
    'frontend/src/modules/logistica/services/logistica.service.js',
  );

  assert.match(page, /isGenerating/);
  assert.match(page, /isRefreshingAfterGeneration/);
  assert.match(page, /setIsGenerating\(false\);[\s\S]*?setGenerationResult\(result\);[\s\S]*?refreshAfterGeneration/);
  assert.match(loading, /La ventana se cerrará cuando el backend responda/);
  assert.doesNotMatch(loading, /\d+%|restante:\s*\d+/i);
  assert.match(service, /\/jornadas-reparto\/generar/);
  assert.match(service, /timeout: 90000/);
});

test('F7A corrige la distancia vial con cancelación, validación y reintento', async () => {
  const form = await readSource(
    'frontend/src/modules/rutas/components/catalogo/RutaFormModal.jsx',
  );
  const service = await readSource(
    'frontend/src/modules/rutas/services/rutas.service.js',
  );

  assert.match(form, /AbortController/);
  assert.match(form, /requestIdRef/);
  assert.match(form, /hasValidRouteCoordinates/);
  assert.match(form, /duplicateRoute/);
  assert.match(form, /readOnly/);
  assert.match(form, /Reintentar cálculo/);
  assert.match(form, /calculation\.status === 'success'/);
  assert.match(service, /VITE_ROUTING_API_URL/);
  assert.match(service, /https:\/\/router\.project-osrm\.org/);
  assert.match(service, /Number\.isFinite/);
  assert.match(service, /ERR_CANCELED/);
  assert.match(service, /route\.distance/);
});

test('F7A consume el CRUD congelado de Camiones con permisos y componentes compartidos', async () => {
  const page = await readSource(
    'frontend/src/modules/camiones/pages/CamionesPage.jsx',
  );
  const service = await readSource(
    'frontend/src/modules/camiones/services/camiones.service.js',
  );
  const form = await readSource(
    'frontend/src/modules/camiones/components/CamionFormModal.jsx',
  );

  assert.match(page, /PERMISSIONS\.CAMIONES_GESTIONAR/);
  assert.match(page, /usePageHeader/);
  assert.match(page, /SearchField/);
  assert.match(page, /Combobox/);
  assert.match(page, /Pagination/);
  assert.match(service, /api\.get\('\/camiones'\)/);
  assert.match(service, /api\.post\('\/camiones'/);
  assert.match(service, /api\.put\(`\/camiones\/\$\{id\}`/);
  assert.match(service, /api\.delete\(`\/camiones\/\$\{id\}`/);
  assert.match(form, /noValidate/);
  assert.match(form, /codigo/);
  assert.match(form, /placa/);
  assert.match(form, /capacidad/);
  assert.match(form, /estado/);
});

test('F7A migra Despachos y el detalle de Jornada a la biblioteca compartida', async () => {
  const dispatches = await readSource(
    'frontend/src/modules/despachos/pages/DespachosPage.jsx',
  );
  const detail = await readSource(
    'frontend/src/modules/logistica/pages/JornadaDetallePage.jsx',
  );

  assert.match(dispatches, /usePageHeader/);
  assert.match(dispatches, /useSearchParams/);
  assert.match(dispatches, /estado/);
  assert.match(dispatches, /fecha/);
  assert.match(dispatches, /Pagination/);
  assert.doesNotMatch(dispatches, /btn btn-|alert alert-|spinner-border/);
  assert.match(detail, /WorkspaceShell/);
  assert.match(detail, /StatCard/);
  assert.match(detail, /StatusBadge/);
  assert.match(detail, /ConfirmDialog/);
  assert.doesNotMatch(detail, /btn btn-|alert alert-|spinner-border/);
});

test('F7A elimina componentes que mezclaban dominios o duplicaban la UI', async () => {
  const removedFiles = [
    'frontend/src/modules/logistica/pages/CentroLogisticoPage.jsx',
    'frontend/src/modules/logistica/components/LogisticsTabs.jsx',
    'frontend/src/modules/logistica/components/LogisticsToolbar.jsx',
    'frontend/src/modules/rutas/components/RutasBanner.jsx',
    'frontend/src/modules/rutas/components/RutasTabs.jsx',
    'frontend/src/modules/rutas/components/RoutesPagination.jsx',
    'frontend/src/modules/despachos/components/DespachosPagination.jsx',
    'frontend/src/modules/rutas/components/camiones/CamionesTab.jsx',
  ];

  await Promise.all(removedFiles.map(assertMissing));
});
