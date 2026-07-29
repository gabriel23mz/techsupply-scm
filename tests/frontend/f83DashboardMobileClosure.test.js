import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(path, 'utf8');

test('F8.3 fuerza una sola columna de métricas en Dashboard móvil', async () => {
  const css = await read('frontend/src/modules/dashboard/dashboard.css');

  assert.match(
    css,
    /@media \(max-width: 576px\)[\s\S]*\.dashboard-metrics-grid\.dashboard-metrics-grid\[data-count\] > \* \{[\s\S]*grid-column: 1 \/ -1;/,
  );
  assert.match(
    css,
    /\.dashboard-metrics-grid \.ui-stat-card \{\s*grid-template-columns: auto minmax\(0, 1fr\);/,
  );
  assert.match(
    css,
    /\.dashboard-metrics-grid \.ui-stat-card__helper \{\s*white-space: normal;/,
  );
});

test('F8.3 elimina archivos compartidos sin consumidores', async () => {
  const deadFiles = [
    'frontend/src/shared/components/Can/Can.jsx',
    'frontend/src/shared/components/Can/index.js',
    'frontend/src/shared/components/Navbar.jsx',
    'frontend/src/shared/hooks/useConfirmNavigation.js',
  ];

  await Promise.all(deadFiles.map((path) => assert.rejects(
    access(path),
    (error) => error?.code === 'ENOENT',
  )));
});

test('F8.3 documenta el cierre real de la capa frontend', async () => {
  const readme = await read('frontend/README.md');

  assert.match(readme, /capa frontend Outbound cerrada para el alcance actual/i);
  assert.match(readme, /Dashboard por rol[\s\S]*Centro de ayuda[\s\S]*Mi Jornada/);
  assert.match(readme, /Productos[\s\S]*Categorías[\s\S]*Usuarios[\s\S]*fuera de este cierre/i);
  assert.doesNotMatch(readme, /la siguiente fase del proyecto será alinear completamente/i);
});
