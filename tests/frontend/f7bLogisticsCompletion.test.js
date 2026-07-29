import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (relativePath) =>
  readFile(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

test('F7B registra Choferes y Mi Jornada como módulos separados por rol', async () => {
  const registry = await readSource(
    'frontend/src/shared/routing/routeRegistry.jsx',
  );
  const navigation = await readSource(
    'frontend/src/shared/constants/navigation.jsx',
  );
  const components = await readSource(
    'frontend/src/shared/routing/routeComponents.jsx',
  );

  assert.match(registry, /id: 'choferes'[\s\S]*?path: '\/choferes'[\s\S]*?PERMISSIONS\.CHOFERES_LEER[\s\S]*?ROLES\.ADMIN[\s\S]*?ROLES\.LOGISTICA/);
  assert.match(registry, /id: 'mi-jornada'[\s\S]*?path: '\/mi-jornada'[\s\S]*?ROLES\.CHOFER[\s\S]*?<MiJornadaPage/);
  assert.match(registry, /id: 'legacy-mis-entregas'[\s\S]*?to="\/mi-jornada"/);
  assert.match(navigation, /'jornadas'[\s\S]*?'despachos'[\s\S]*?'camiones'[\s\S]*?'choferes'[\s\S]*?'rutas'[\s\S]*?'ubicaciones'/);
  assert.match(navigation, /id: 'chofer'[\s\S]*?'mi-jornada'/);
  assert.match(components, /ChoferesPage[\s\S]*?modules\/choferes\/pages\/ChoferesPage/);
  assert.match(components, /MiJornadaPage[\s\S]*?modules\/chofer\/pages\/MiJornadaPage/);
});

test('F7B consume el CRUD congelado de Choferes sin ampliar el backend', async () => {
  const service = await readSource(
    'frontend/src/modules/choferes/services/choferes.service.js',
  );
  const page = await readSource(
    'frontend/src/modules/choferes/pages/ChoferesPage.jsx',
  );
  const form = await readSource(
    'frontend/src/modules/choferes/components/ChoferFormModal.jsx',
  );

  assert.match(service, /api\.get\('\/choferes'\)/);
  assert.match(service, /api\.get\(`\/choferes\/\$\{id\}`\)/);
  assert.match(service, /api\.post\('\/choferes', payload\)/);
  assert.match(service, /api\.put\(`\/choferes\/\$\{id\}`, payload\)/);
  assert.match(service, /api\.delete\(`\/choferes\/\$\{id\}`\)/);
  assert.match(page, /PERMISSIONS\.CHOFERES_GESTIONAR/);
  assert.match(page, /PERMISSIONS\.USUARIOS_GESTIONAR/);
  assert.match(form, /usuario_id/);
  assert.match(form, /numero_licencia/);
  assert.match(form, /categoria_licencia/);
  assert.match(form, /fecha_vencimiento_licencia/);
  assert.match(form, /noValidate/);
});

test('F7B permite asignar y reasignar choferes solo en jornadas planificadas', async () => {
  const service = await readSource(
    'frontend/src/modules/logistica/services/logistica.service.js',
  );
  const detail = await readSource(
    'frontend/src/modules/logistica/pages/JornadaDetallePage.jsx',
  );
  const modal = await readSource(
    'frontend/src/modules/logistica/components/AsignarChoferModal.jsx',
  );

  assert.match(service, /api\.get\([\s\S]*?'\/choferes\/disponibles'/);
  assert.match(service, /`\/jornadas-reparto\/\$\{id\}\/asignar-chofer`[\s\S]*?chofer_id: choferId/);
  assert.match(detail, /PERMISSIONS\.JORNADAS_ASIGNAR_CHOFER/);
  assert.match(detail, /jornada\?\.estado !== 'PLANIFICADA'/);
  assert.match(detail, /obtenerChoferesDisponibles\(jornada\.fecha\)/);
  assert.match(detail, /asignarChoferJornada\(jornada\.id, choferId\)/);
  assert.match(modal, /Reasignar chofer/);
  assert.match(modal, /licencia vigente y sin otra jornada en conflicto/);
});

test('F7B implementa Mi Jornada con contratos propios y acciones operativas', async () => {
  const service = await readSource(
    'frontend/src/modules/chofer/services/miJornada.service.js',
  );
  const page = await readSource(
    'frontend/src/modules/chofer/pages/MiJornadaPage.jsx',
  );

  assert.match(service, /api\.get\('\/choferes\/me'\)/);
  assert.match(service, /api\.get\('\/jornadas-reparto\/mis-jornadas'\)/);
  assert.match(service, /`\/jornadas-reparto\/\$\{id\}`/);
  assert.match(service, /`\/jornadas-reparto\/\$\{id\}\/iniciar`/);
  assert.match(service, /`\/jornadas-reparto\/\$\{id\}\/avanzar`/);
  assert.match(service, /`\/jornadas-reparto\/\$\{id\}\/finalizar`/);
  assert.match(service, /`\/despachos\/\$\{id\}\/entregar`/);
  assert.match(service, /`\/despachos\/\$\{id\}\/no-entregado`/);
  assert.match(page, /choosePrimaryJourney/);
  assert.match(page, /JornadaMap/);
  assert.match(page, /Punto actual/);
  assert.match(page, /Entregar/);
  assert.match(page, /No entregado/);
  assert.match(page, /Siguiente punto/);
  assert.match(page, /Finalizar jornada/);
  assert.match(page, /ConfirmDialog/);
});

test('F7B entrega una experiencia mobile-first con mapa y operación equilibrados', async () => {
  const page = await readSource(
    'frontend/src/modules/chofer/pages/MiJornadaPage.jsx',
  );
  const css = await readSource(
    'frontend/src/modules/chofer/mi-jornada.css',
  );

  assert.match(page, /my-journey-route-column[\s\S]*?my-journey-actions[\s\S]*?my-journey-map-wrap/);
  assert.doesNotMatch(page, /my-journey-sticky-actions/);
  assert.match(css, /\.my-journey-dispatch-card__actions\s*\{[\s\S]*?grid-template-columns: repeat\(2/);
  assert.match(css, /@media \(max-width: 576px\)[\s\S]*?\.my-journey-dispatch-card__actions[\s\S]*?grid-template-columns: 1fr/);
  assert.match(css, /@media \(min-width: 768px\)[\s\S]*?grid-template-areas: 'map route'/);
  assert.match(css, /\.my-journey-map-wrap \.journey-map-card\s*\{[\s\S]*?margin-top: 0/);
  assert.match(css, /\.my-journey-route-column[\s\S]*?grid-template-rows: minmax\(0, 1fr\) auto/);
  assert.match(css, /\.my-journey-actions\s*\{[\s\S]*?justify-content: flex-end/);
});

test('F7B corrige la higiene React y el error de nombre del catálogo de Rutas', async () => {
  const catalog = await readSource(
    'frontend/src/modules/rutas/components/catalogo/RutasCatalogo.jsx',
  );
  const page = await readSource(
    'frontend/src/modules/rutas/pages/RutasPage.jsx',
  );
  const registry = await readSource(
    'frontend/src/shared/routing/routeRegistry.jsx',
  );

  assert.match(catalog, /RutasCatalogoToolbar/);
  assert.doesNotMatch(catalog, /RoutesCatalogoToolbar/);
  assert.doesNotMatch(catalog, /useEffect/);
  assert.doesNotMatch(page, /createRequestToken/);
  assert.doesNotMatch(registry, /function LegacyJornadaRedirect/);
  assert.match(registry, /import LegacyJornadaRedirect/);
});

test('F7B reserva Despachos para supervisión y mueve la operación del chofer', async () => {
  const dispatchPage = await readSource(
    'frontend/src/modules/despachos/pages/DespachosPage.jsx',
  );

  assert.doesNotMatch(dispatchPage, /isDriverView/);
  assert.doesNotMatch(dispatchPage, /Mis entregas/);
  assert.match(dispatchPage, /title: 'Despachos'/);
  assert.match(dispatchPage, /Seguimiento administrativo/);
});


test('F7B alinea el seguimiento administrativo y limita Finalizar al último punto', async () => {
  const page = await readSource(
    'frontend/src/modules/logistica/pages/JornadaDetallePage.jsx',
  );
  const css = await readSource(
    'frontend/src/modules/logistica/logistica.css',
  );

  assert.match(page, /const hasReachedLastPoint =[\s\S]*?currentOrder >= lastPointOrder/);
  assert.match(page, /const canRenderFinishAction =[\s\S]*?hasReachedLastPoint[\s\S]*?currentPointClosed[\s\S]*?allDispatchesClosed/);
  assert.match(page, /\{canRenderFinishAction && \([\s\S]*?>\s*Finalizar\s*<\/Button>/);
  assert.doesNotMatch(page, /footer=\{footer\}/);
  assert.match(
    page,
    /journey-progress-card[\s\S]*?\{operationalActions\}/,
  );
  assert.match(
    css,
    /\.journey-workspace\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) clamp\(18rem, 24vw, 22rem\)/,
  );
  assert.match(
    css,
    /\.journey-workspace > \.workspace-shell__content\s*\{[\s\S]*?grid-column:\s*1;[\s\S]*?grid-row:\s*1/,
  );
  assert.match(
    css,
    /\.journey-workspace > \.workspace-shell__sidebar\s*\{[\s\S]*?grid-column:\s*2;[\s\S]*?grid-row:\s*1/,
  );
  assert.match(css, /\.journey-sidebar-actions\s*\{[\s\S]*?grid-template-columns: 1fr/);
  assert.doesNotMatch(page, /const inlineActions/);
  assert.doesNotMatch(css, /\.journey-workspace > \.workspace-shell__footer/);
});

test('F7B cierre evita el desplegable vacío y amplía el seguimiento operativo', async () => {
  const form = await readSource(
    'frontend/src/modules/choferes/components/ChoferFormModal.jsx',
  );
  const driverCss = await readSource(
    'frontend/src/modules/choferes/choferes.css',
  );
  const logisticsCss = await readSource(
    'frontend/src/modules/logistica/logistica.css',
  );

  assert.match(form, /const noAvailableUsers = mode === 'create' && userOptions\.length === 0/);
  assert.match(form, /No hay usuarios CHOFER disponibles/);
  assert.match(form, /\{noAvailableUsers \? \([\s\S]*?drivers-user-empty[\s\S]*?: \([\s\S]*?<Combobox/);
  assert.match(driverCss, /drivers-form-grid--profile[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(driverCss, /drivers-active-card[\s\S]*?width:\s*100%/);
  assert.match(logisticsCss, /journeys-map-workspace[\s\S]*?minmax\(26rem, 31\.5rem\)/);
});
