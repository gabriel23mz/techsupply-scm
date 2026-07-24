import test from 'node:test';
import assert from 'node:assert/strict';

import { modelInstance, stubMethods } from './helpers/testEnv.js';

test('categorias caracteriza listado, actualización y eliminación lógica', async (t) => {
  const service = await import('../../src/services/categoria.service.js');
  const { default: Categoria } = await import('../../src/models/Categoria.js');
  const categoria = modelInstance({ id: 1, nombre: 'Hardware', estado: true });

  stubMethods(t, Categoria, {
    findAll: async (query) => {
      assert.deepEqual(query.where, { estado: true });
      assert.deepEqual(query.order, [['id', 'ASC']]);
      return [categoria];
    },
    findOne: async (query) => {
      if (query.where?.nombre === 'Redes') return null;
      return categoria;
    },
    create: async (datos) => ({ id: 2, ...datos }),
  });

  assert.deepEqual(await service.obtenerTodas(), [categoria]);
  assert.deepEqual(await service.crear({ nombre: 'Redes' }), { id: 2, nombre: 'Redes' });

  assert.equal(await service.actualizar(1, { descripcion: 'Activa' }), categoria);
  assert.deepEqual(categoria.update.mock.calls[0].arguments[0], { descripcion: 'Activa' });

  assert.equal(await service.eliminar(1), true);
  assert.deepEqual(categoria.update.mock.calls[1].arguments[0], { estado: false });
});

test('usuarios excluye password_hash y elimina mediante estado false', async (t) => {
  const service = await import('../../src/services/usuario.service.js');
  const { default: Usuario } = await import('../../src/models/Usuario.js');
  const usuario = modelInstance({ id: 7, correo: 'u@demo.test', estado: true });

  stubMethods(t, Usuario, {
    findAll: async (query) => {
      assert.deepEqual(query.attributes, { exclude: ['password_hash'] });
      return [usuario];
    },
    findOne: async (query) => {
      if (query.where?.id === 404) return null;
      return usuario;
    },
    create: async (datos) => ({ id: 8, ...datos }),
  });

  assert.deepEqual(await service.obtenerTodos(), [usuario]);
  await assert.rejects(
    () => service.eliminar(404),
    /Usuario no encontrado/,
  );
  assert.equal(await service.eliminar(7), true);
  assert.deepEqual(usuario.update.mock.calls[0].arguments[0], { estado: false });
});

test('clientes, ubicaciones, productos y rutas mantienen filtros activos e includes actuales', async (t) => {
  const clienteService = await import('../../src/services/cliente.service.js');
  const ubicacionService = await import('../../src/services/ubicacion.service.js');
  const productoService = await import('../../src/services/producto.service.js');
  const rutaService = await import('../../src/services/ruta.service.js');

  const { default: Cliente } = await import('../../src/models/Cliente.js');
  const { default: Ubicacion } = await import('../../src/models/Ubicacion.js');
  const { default: Producto } = await import('../../src/models/Producto.js');
  const { default: Ruta } = await import('../../src/models/Ruta.js');
  const { default: Categoria } = await import('../../src/models/Categoria.js');

  stubMethods(t, Cliente, {
    findAll: async (query) => {
      assert.deepEqual(query.where, { estado: true });
      assert.equal(query.include[0].model, Ubicacion);
      return [];
    },
    findOne: async () => null,
  });

  stubMethods(t, Ubicacion, {
    findAll: async (query) => {
      assert.deepEqual(query.where, { estado: true });
      return [];
    },
    findOne: async () => null,
  });

  stubMethods(t, Producto, {
    findAll: async (query) => {
      assert.deepEqual(query.where, { estado: true });
      assert.equal(query.include[0].model, Categoria);
      return [];
    },
    findOne: async () => null,
  });

  stubMethods(t, Ruta, {
    findAll: async (query) => {
      assert.deepEqual(query.where, { estado: true });
      assert.equal(query.include[0].as, 'origen');
      assert.equal(query.include[1].as, 'destino');
      return [];
    },
    findOne: async () => null,
  });

  assert.deepEqual(await clienteService.obtenerTodos(), []);
  assert.deepEqual(await ubicacionService.obtenerTodas(), []);
  assert.deepEqual(await productoService.obtenerTodos(), []);
  assert.deepEqual(await rutaService.obtenerTodas(), []);
});

test('camiones resume jornada vigente priorizando EN_RUTA sobre PLANIFICADA', async (t) => {
  const service = await import('../../src/services/camion.service.js');
  const { default: db } = await import('../../src/models/index.js');
  const camion = modelInstance({
    id: 5,
    placa: 'ABC-555',
    capacidad: 3,
    estado: 'EN_RUTA',
    jornadas: [
      { id: 11, estado: 'PLANIFICADA', despachos: [{ id: 1 }] },
      { id: 10, estado: 'EN_RUTA', posicion_actual_orden: 2, despachos: [{ id: 2 }, { id: 3 }] },
    ],
  });

  stubMethods(t, db.Camion, {
    findAll: async () => [camion],
  });

  const [resumen] = await service.obtenerTodos();

  assert.equal(resumen.codigo, 'CAM-005');
  assert.equal(resumen.pedidos_asignados, 2);
  assert.equal(resumen.capacidad_disponible, 1);
  assert.equal(resumen.porcentaje_ocupacion, 67);
  assert.equal(resumen.jornada.id, 10);
});
