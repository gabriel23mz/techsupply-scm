import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(path, 'utf8');

test('F9.3 inicia el mapa en vista general y permite restaurar todos los camiones', async () => {
  const [page, map] = await Promise.all([
    read('frontend/src/modules/logistica/pages/JornadasPage.jsx'),
    read('frontend/src/modules/logistica/components/mapa/MapaGeneralJornadas.jsx'),
  ]);

  assert.match(page, /if \(!selectedJourneyId \|\| !mapJourneys\.length\) return null/);
  assert.match(page, /onShowAll=\{\(\) => \{[\s\S]*?setSelectedJourneyId\(null\)/);
  assert.match(map, /const visibleJourneys = selectedJourney[\s\S]*?\[selectedJourney\][\s\S]*?normalizedJourneys/);
  assert.match(map, /Mostrar posicionamiento de camiones/);
  assert.match(map, /\{visibleJourneys\.map/);
});

test('F9.3 mantiene las métricas de cada tarjeta en una sola línea', async () => {
  const [card, mapCss, logisticsCss] = await Promise.all([
    read('frontend/src/modules/logistica/components/mapa/JornadaMapaCard.jsx'),
    read('frontend/src/modules/logistica/jornadas-mapa.css'),
    read('frontend/src/modules/logistica/logistica.css'),
  ]);

  assert.match(card, /<strong>\{totalDespachos\}<\/strong>\s*<small>despachos<\/small>/);
  assert.match(card, /<strong>\{totalPuntos\}<\/strong>\s*<small>puntos<\/small>/);
  assert.match(mapCss, /routes-journey-card[\s\S]*?min-height:\s*14rem/);
  assert.match(mapCss, /routes-journey-card__summary[\s\S]*?display:\s*flex/);
  assert.match(logisticsCss, /grid-template-columns:\s*minmax\(26rem, 31\.5rem\) minmax\(0, 1fr\)/);
});
