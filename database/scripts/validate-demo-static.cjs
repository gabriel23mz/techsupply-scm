'use strict';

const {
  locations,
  categories,
  buildProducts,
  buildClients,
  buildRoutes,
  buildJourneyDefinitions,
  buildDispatchDefinitions,
  orderStateForId,
  deliveredAtForOrder,
} = require('../support/demoData.cjs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertUnique(rows, selector, label) {
  const values = rows.map(selector);
  assert(
    new Set(values).size === values.length,
    `Existen valores duplicados en ${label}.`,
  );
}

try {
  const products = buildProducts();
  const clients = buildClients();
  const routes = buildRoutes(4);
  const journeys = buildJourneyDefinitions();
  const dispatches = buildDispatchDefinitions();

  assert(locations.length === 30, 'Se esperaban 30 ubicaciones.');
  assert(locations[0].nombre === 'Bodega Central ESPAM MFL', 'La bodega central no es ESPAM MFL.');
  assert(categories.length === 12, 'Se esperaban 12 categorías.');
  assert(products.length === 72, 'Se esperaban 72 productos.');
  assert(clients.length === 48, 'Se esperaban 48 clientes.');
  assert(routes.length >= 100, 'Se esperaban al menos 100 rutas dirigidas.');
  assert(journeys.length === 7, 'Se esperaban 7 jornadas demo.');
  assert(dispatches.length === 30, 'Se esperaban 30 despachos demo.');

  assertUnique(products, (item) => item.id, 'IDs de productos');
  assertUnique(products, (item) => item.codigo, 'códigos de productos');
  assertUnique(clients, (item) => item.id, 'IDs de clientes');
  assertUnique(clients, (item) => item.correo, 'correos de clientes');
  assertUnique(routes, (item) => `${item.origen_id}-${item.destino_id}`, 'rutas');
  assertUnique(dispatches, (item) => item.id, 'IDs de despachos');
  assertUnique(
    dispatches,
    (item) => `${item.jornada_reparto_id}-${item.orden_entrega}`,
    'orden de entrega por jornada',
  );

  for (let orderId = 1; orderId <= 72; orderId += 1) {
    const state = orderStateForId(orderId);
    const deliveredAt = deliveredAtForOrder(orderId);
    assert(
      (state === 'ENTREGADO') === Boolean(deliveredAt),
      `El pedido ${orderId} no coincide entre estado y fecha real de entrega.`,
    );
  }

  const activeByTruckDate = new Set();
  const activeByDriverDate = new Set();
  const trucksOnRoute = new Set();
  const driversOnRoute = new Set();

  for (const journey of journeys) {
    if (['PLANIFICADA', 'EN_RUTA'].includes(journey.state)) {
      const truckKey = `${journey.truck}-${journey.date}`;
      const driverKey = `${journey.driver}-${journey.date}`;
      assert(!activeByTruckDate.has(truckKey), `Conflicto diario de camión ${truckKey}.`);
      assert(!activeByDriverDate.has(driverKey), `Conflicto diario de chofer ${driverKey}.`);
      activeByTruckDate.add(truckKey);
      activeByDriverDate.add(driverKey);
    }

    if (journey.state === 'EN_RUTA') {
      assert(!trucksOnRoute.has(journey.truck), `Camión ${journey.truck} duplicado EN_RUTA.`);
      assert(!driversOnRoute.has(journey.driver), `Chofer ${journey.driver} duplicado EN_RUTA.`);
      trucksOnRoute.add(journey.truck);
      driversOnRoute.add(journey.driver);
    }
  }

  console.log('✅ Datos demo estáticos validados.');
  console.log(`Ubicaciones: ${locations.length}`);
  console.log(`Rutas dirigidas: ${routes.length}`);
  console.log(`Productos: ${products.length}`);
  console.log(`Clientes: ${clients.length}`);
  console.log(`Jornadas: ${journeys.length}`);
  console.log(`Despachos: ${dispatches.length}`);
} catch (error) {
  console.error('❌ Validación estática fallida:', error.message);
  process.exitCode = 1;
}
