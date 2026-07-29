import assert from 'node:assert/strict';
import {
  readFile,
} from 'node:fs/promises';
import test from 'node:test';

const projectRoot = new URL('../../', import.meta.url);

const readSource = (relativePath) =>
  readFile(new URL(relativePath, projectRoot), 'utf8');

test('F3.2 incorpora el sistema compartido de mapas definido por la auditoría', async () => {
  const index = await readSource(
    'frontend/src/shared/maps/index.js',
  );
  const expectedExports = [
    'MapShell',
    'MapControls',
    'MapLegend',
    'MapViewportController',
    'MapLoadingState',
    'MapErrorState',
    'createMapMarker',
    'normalizeMapGeometry',
    'normalizeMapPosition',
    'normalizeMapPositions',
  ];

  for (const component of expectedExports) {
    assert.match(index, new RegExp(component), component);
  }
});

test('F3.2 unifica zoom, ajuste de puntos y restablecimiento mediante controles accesibles', async () => {
  const controls = await readSource(
    'frontend/src/shared/maps/MapControls/MapControls.jsx',
  );

  assert.match(controls, /useMap/);
  assert.match(controls, /role="toolbar"/);
  assert.match(controls, /map\.zoomIn\(\)/);
  assert.match(controls, /map\.zoomOut\(\)/);
  assert.match(controls, /map\.flyToBounds/);
  assert.match(controls, /map\.flyTo/);
  assert.match(controls, /IconButton/);
  assert.match(controls, /Ajustar todos los puntos/);
  assert.match(controls, /Restablecer vista/);
});

test('F3.2 centraliza el viewport con foco selectivo y ajuste automático', async () => {
  const viewport = await readSource(
    'frontend/src/shared/maps/MapViewportController/MapViewportController.jsx',
  );

  assert.match(viewport, /focusPositions/);
  assert.match(viewport, /positions/);
  assert.match(viewport, /requestKey/);
  assert.match(viewport, /map\.invalidateSize\(\)/);
  assert.match(viewport, /map\.flyToBounds/);
  assert.match(viewport, /map\.flyTo/);
  assert.match(viewport, /normalizeMapPositions/);
});

test('F3.2 comparte shell, estados, leyenda y marcadores compatibles con temas', async () => {
  const shell = await readSource(
    'frontend/src/shared/maps/MapShell/MapShell.jsx',
  );
  const shellCss = await readSource(
    'frontend/src/shared/maps/MapShell/MapShell.css',
  );
  const legend = await readSource(
    'frontend/src/shared/maps/MapLegend/MapLegend.jsx',
  );
  const marker = await readSource(
    'frontend/src/shared/maps/markerFactory.js',
  );
  const variables = await readSource(
    'frontend/src/shared/styles/variables.css',
  );

  assert.match(shell, /MapLoadingState/);
  assert.match(shell, /MapErrorState/);
  assert.match(shellCss, /html\[data-theme='dark'\]/);
  assert.match(shellCss, /leaflet-tile-pane/);
  assert.match(legend, /map-legend__swatch/);
  assert.match(marker, /escapeHtml/);
  assert.match(marker, /L\.divIcon/);
  assert.match(variables, /--map-control-border:/);
  assert.match(variables, /--map-shell-background:/);
  assert.match(variables, /--map-feedback-overlay:/);
});

test('F3.2 migra todos los MapContainer actuales a controles compartidos', async () => {
  const files = [
    'frontend/src/modules/logistica/components/JornadaMap.jsx',
    'frontend/src/modules/logistica/components/mapa/MapaGeneralJornadas.jsx',
    'frontend/src/modules/ubicaciones/components/UbicacionDetailModal.jsx',
    'frontend/src/modules/ubicaciones/components/UbicacionFormModal.jsx',
    'frontend/src/modules/ubicaciones/components/UbicacionesMapaGeneral.jsx',
  ];

  for (const file of files) {
    const source = await readSource(file);

    assert.match(source, /zoomControl=\{false\}/, file);
    assert.match(source, /MapControls/, file);
    assert.match(source, /MapShell/, file);
  }
});

test('F3.2 elimina controladores y botones de mapa duplicados de los módulos migrados', async () => {
  const journey = await readSource(
    'frontend/src/modules/logistica/components/JornadaMap.jsx',
  );
  const routes = await readSource(
    'frontend/src/modules/logistica/components/mapa/MapaGeneralJornadas.jsx',
  );
  const locations = await readSource(
    'frontend/src/modules/ubicaciones/components/UbicacionesMapaGeneral.jsx',
  );
  const form = await readSource(
    'frontend/src/modules/ubicaciones/components/UbicacionFormModal.jsx',
  );

  assert.doesNotMatch(journey, /function MapBoundsController/);
  assert.doesNotMatch(journey, /routes-map-recenter-button/);
  assert.doesNotMatch(routes, /function MapViewportController/);
  assert.doesNotMatch(routes, /routes-map-recenter-button/);
  assert.doesNotMatch(locations, /locations-general-map-actions/);
  assert.doesNotMatch(form, /locations-form-map-controls/);
});
