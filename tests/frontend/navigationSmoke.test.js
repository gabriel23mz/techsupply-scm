import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (relativePath) =>
  readFile(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

test('frontend conserva la navegación principal mediante secciones y registro de rutas', async () => {
  const navigation = await readSource(
    'frontend/src/shared/constants/navigation.jsx',
  );
  const registry = await readSource(
    'frontend/src/shared/routing/routeRegistry.jsx',
  );
  const frontendPackage = JSON.parse(
    await readSource('frontend/package.json'),
  );

  for (const id of [
    'dashboard',
    'clientes',
    'pedidos',
    'centro-logistico',
    'despachos',
    'rutas',
    'ubicaciones',
    'mis-entregas',
  ]) {
    assert.match(
      navigation,
      new RegExp(`['"]${id}['"]`),
      `${id} debe permanecer en la navegación`,
    );
  }

  for (const path of [
    '/',
    '/clientes',
    '/pedidos',
    '/ubicaciones',
    '/rutas',
    '/centro-logistico',
    '/despachos',
    '/mis-entregas',
  ]) {
    const escapedPath = path.replaceAll('/', '\\/');

    assert.match(
      registry,
      new RegExp(`path: ['"]${escapedPath}['"]`),
      `${path} debe permanecer en el registro de rutas`,
    );
  }

  assert.equal(
    frontendPackage.scripts?.test,
    undefined,
    'las pruebas frontend continúan ejecutándose desde la raíz',
  );
});
