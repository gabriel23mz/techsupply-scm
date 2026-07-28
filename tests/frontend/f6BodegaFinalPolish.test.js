import assert from 'node:assert/strict';
import test from 'node:test';
import {
  readFile,
} from 'node:fs/promises';

const readProjectFile = (relativePath) => readFile(
  new URL(`../../${relativePath}`, import.meta.url),
  'utf8',
);

test('F6 final evita que el estado del drawer de preparación se desborde', async () => {
  const css = await readProjectFile(
    'frontend/src/modules/bodega/bodega.css',
  );

  assert.match(
    css,
    /warehouse-preparation-drawer__hero > div \{[\s\S]*grid-template-columns: minmax\(0, 1fr\) auto;/,
  );
  assert.match(
    css,
    /warehouse-preparation-drawer__hero \.ui-status-badge \{[\s\S]*justify-self: end;[\s\S]*white-space: nowrap;/,
  );
});

test('F6 final separa visualmente los encabezados del workspace de preparación', async () => {
  const css = await readProjectFile(
    'frontend/src/modules/bodega/bodega.css',
  );
  const table = await readProjectFile(
    'frontend/src/modules/bodega/components/PreparationWorkspaceTable.jsx',
  );

  assert.match(
    css,
    /warehouse-workspace-table thead th \+ th \{[\s\S]*border-left: 1px solid var\(--color-border\);/,
  );
  assert.match(table, /header: 'Solicitado',[\s\S]*width: '12%'/);
  assert.match(table, /header: 'Pendiente',[\s\S]*width: '11%'/);
  assert.match(table, /header: 'Acciones',[\s\S]*width: '17%'/);
});

test('F6 final unifica la alineación móvil de las cuatro tablas de Bodega', async () => {
  const css = await readProjectFile(
    'frontend/src/modules/bodega/bodega.css',
  );

  assert.match(
    css,
    /warehouse-preparation-table td,[\s\S]*warehouse-load-workspace-table td \{[\s\S]*grid-template-columns: minmax\(7\.5rem, 42%\) minmax\(0, 1fr\);[\s\S]*align-items: center;/,
  );
  assert.match(
    css,
    /warehouse-load-workspace-table \.ui-data-table__cell-content \{[\s\S]*justify-self: end;[\s\S]*text-align: right;/,
  );
});

test('F6 final coloca el estado del despacho en la esquina superior derecha en móvil', async () => {
  const css = await readProjectFile(
    'frontend/src/modules/bodega/bodega.css',
  );

  assert.match(
    css,
    /warehouse-load-dispatch-card > \.ui-status-badge \{[\s\S]*grid-column: 2;[\s\S]*grid-row: 1;[\s\S]*justify-self: end;/,
  );
});

test('F6 final elimina la regla móvil duplicada de F6.2', async () => {
  const css = await readProjectFile(
    'frontend/src/modules/bodega/bodega.css',
  );

  assert.doesNotMatch(
    css,
    /F6\.2: centra verticalmente etiqueta y valor/,
  );
});
