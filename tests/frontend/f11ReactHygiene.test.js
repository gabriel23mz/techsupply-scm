import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (relativePath) =>
  readFile(new URL(`../../${relativePath}`, import.meta.url), 'utf8');

test('F1.1 separa providers, contextos y hooks para conservar Fast Refresh', async () => {
  const authProvider = await readSource(
    'frontend/src/shared/contexts/AuthContext.jsx',
  );
  const preferencesProvider = await readSource(
    'frontend/src/shared/contexts/PreferencesContext.jsx',
  );
  const useAuth = await readSource(
    'frontend/src/shared/hooks/useAuth.js',
  );
  const usePreferences = await readSource(
    'frontend/src/shared/hooks/usePreferences.js',
  );

  assert.doesNotMatch(authProvider, /export function useAuth/);
  assert.doesNotMatch(
    preferencesProvider,
    /export function usePreferences/,
  );
  assert.match(useAuth, /export function useAuth/);
  assert.match(
    usePreferences,
    /export function usePreferences/,
  );
});

test('F1.1 elimina efectos usados únicamente para reiniciar paginación', async () => {
  const files = [
    'frontend/src/modules/clientes/pages/ClientesPage.jsx',
    'frontend/src/modules/despachos/pages/DespachosPage.jsx',
    'frontend/src/modules/pedidos/pages/PedidosPage.jsx',
    'frontend/src/modules/ubicaciones/pages/UbicacionesPage.jsx',
    'frontend/src/modules/rutas/components/camiones/CamionesTab.jsx',
    'frontend/src/modules/rutas/components/catalogo/RutasCatalogo.jsx',
  ];

  for (const file of files) {
    const source = await readSource(file);

    assert.doesNotMatch(
      source,
      /useEffect\(\(\) => \{\s*setCurrentPage\(/,
      file,
    );
    assert.match(source, /safeCurrentPage/);
  }
});

test('F1.1 inicializa formularios mediante remount controlado', async () => {
  const clients = await readSource(
    'frontend/src/modules/clientes/components/ClienteFormModal.jsx',
  );
  const order = await readSource(
    'frontend/src/modules/pedidos/components/PedidoEditModal.jsx',
  );
  const product = await readSource(
    'frontend/src/modules/pedidos/components/workspace/PedidoProductForm.jsx',
  );
  const location = await readSource(
    'frontend/src/modules/ubicaciones/components/UbicacionFormModal.jsx',
  );

  for (const source of [clients, order, product, location]) {
    assert.doesNotMatch(source, /useEffect\([\s\S]*?setFormData/);
  }

  assert.match(clients, /buildInitialForm/);
  assert.match(order, /buildInitialForm/);
  assert.match(product, /buildInitialForm/);
  assert.match(location, /getInitialLocation/);
});
