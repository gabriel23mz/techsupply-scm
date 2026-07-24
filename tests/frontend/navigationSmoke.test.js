import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('frontend no trae infraestructura de test dedicada y conserva rutas principales de navegación', async () => {
  const packageJson = JSON.parse(
    await readFile(new URL('../../frontend/package.json', import.meta.url), 'utf8'),
  );
  const navigation = await readFile(
    new URL('../../frontend/src/shared/constants/navigation.jsx', import.meta.url),
    'utf8',
  );

  assert.equal(packageJson.scripts.test, undefined);

  for (const route of [
    '/clientes',
    '/pedidos',
    '/ubicaciones',
    '/rutas',
    '/centro-logistico',
    '/despachos',
  ]) {
    assert.match(navigation, new RegExp(`path: '${route}'`));
  }
});
