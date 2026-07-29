import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(path, 'utf8');

test('F9.2 coloca el camión sobre el punto actual en mapas activos', async () => {
  const [generalMap, journeyMap] = await Promise.all([
    read('frontend/src/modules/logistica/components/mapa/MapaGeneralJornadas.jsx'),
    read('frontend/src/modules/logistica/components/JornadaMap.jsx'),
  ]);

  assert.match(generalMap, /mapa\?\.posicion_actual/);
  assert.match(generalMap, /estado === 'EN_RUTA'[\s\S]*?currentDeliveryPosition/);
  assert.match(generalMap, /truckReplacesCurrentPoint/);
  assert.match(journeyMap, /estadoJornada === 'EN_RUTA'[\s\S]*?currentDeliveryPosition/);
  assert.match(journeyMap, /areSamePositions\(pointPosition, truckPosition\)/);
});

test('F9.2 conserva la bodega del mapa general y mejora las tarjetas', async () => {
  const [page, card, css] = await Promise.all([
    read('frontend/src/modules/logistica/pages/JornadasPage.jsx'),
    read('frontend/src/modules/logistica/components/mapa/JornadaMapaCard.jsx'),
    read('frontend/src/modules/logistica/jornadas-mapa.css'),
  ]);

  assert.match(page, /const bodega = value\?\.bodega/);
  assert.match(page, /mapa:[\s\S]*?bodega:/);
  assert.match(card, /<small>despachos<\/small>/);
  assert.match(card, /<small>punto actual<\/small>/);
  assert.match(css, /routes-journey-card__summary[\s\S]*?display:\s*flex/);
});
