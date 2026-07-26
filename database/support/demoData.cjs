'use strict';

const TIMEZONE = process.env.APP_TIMEZONE || 'America/Guayaquil';
const OPERATION_MINUTES_PER_DAY = Number(
  process.env.MINUTOS_MAXIMOS_OPERACION_DIA || 600,
);
const SERVICE_MINUTES_PER_DELIVERY = Number(
  process.env.TIEMPO_SERVICIO_POR_ENTREGA_MIN || 10,
);
const OPERATING_MARGIN_PERCENT = Number(
  process.env.MARGEN_OPERATIVO_PORCENTAJE || 15,
);

const pad = (value) => String(value).padStart(2, '0');
const round2 = (value) => Math.round(Number(value) * 100) / 100;

function partsInTimezone(date = new Date(), timeZone = TIMEZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)]),
  );
}

function zonedDateTimeToUtc(
  year,
  month,
  day,
  hour,
  minute,
  timeZone = TIMEZONE,
) {
  const intended = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let guess = intended;

  for (let index = 0; index < 3; index += 1) {
    const current = partsInTimezone(new Date(guess), timeZone);
    const represented = Date.UTC(
      current.year,
      current.month - 1,
      current.day,
      current.hour,
      current.minute,
      current.second,
      0,
    );
    guess += intended - represented;
  }

  return new Date(guess);
}

function atTimezoneOffset(daysOffset, hour = 8, minute = 0) {
  const today = partsInTimezone(new Date(), TIMEZONE);
  const shifted = new Date(Date.UTC(
    today.year,
    today.month - 1,
    today.day + daysOffset,
    12,
    0,
    0,
    0,
  ));
  const shiftedParts = partsInTimezone(shifted, 'UTC');

  return zonedDateTimeToUtc(
    shiftedParts.year,
    shiftedParts.month,
    shiftedParts.day,
    hour,
    minute,
    TIMEZONE,
  );
}

function dateOnlyInTimezone(date = new Date(), timeZone = TIMEZONE) {
  const parts = partsInTimezone(date, timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function dateOnlyOffset(daysOffset) {
  return dateOnlyInTimezone(atTimezoneOffset(daysOffset, 12, 0));
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + Number(minutes) * 60 * 1000);
}

function addOperatingMinutes(
  start,
  totalMinutes,
  dailyLimit = OPERATION_MINUTES_PER_DAY,
) {
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
    throw new Error('La fecha inicial operativa no es válida.');
  }

  const minutes = Math.max(0, Math.ceil(Number(totalMinutes) || 0));
  const limit = Math.max(1, Math.floor(Number(dailyLimit) || 1));
  const fullDays = Math.floor(minutes / limit);
  const remainder = minutes % limit;

  return addMinutes(start, fullDays * 24 * 60 + remainder);
}

function haversineKm(a, b) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(Number(b.latitud) - Number(a.latitud));
  const dLon = toRadians(Number(b.longitud) - Number(a.longitud));
  const lat1 = toRadians(Number(a.latitud));
  const lat2 = toRadians(Number(b.latitud));

  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(value));
}

const locations = [
  {
    id: 1,
    nombre: 'Bodega Central ESPAM MFL',
    latitud: -0.82726,
    longitud: -80.18695,
  },
  { id: 2, nombre: 'Calceta Centro', latitud: -0.84582, longitud: -80.16389 },
  { id: 3, nombre: 'Tosagua', latitud: -0.78601, longitud: -80.23473 },
  { id: 4, nombre: 'Junín', latitud: -0.92771, longitud: -80.20583 },
  { id: 5, nombre: 'Chone', latitud: -0.69819, longitud: -80.09361 },
  { id: 6, nombre: 'Rocafuerte', latitud: -0.92360, longitud: -80.44946 },
  { id: 7, nombre: 'Portoviejo Centro', latitud: -1.05618, longitud: -80.45522 },
  { id: 8, nombre: 'Manta', latitud: -0.96765, longitud: -80.70891 },
  { id: 9, nombre: 'Montecristi', latitud: -1.04576, longitud: -80.65889 },
  { id: 10, nombre: 'Jaramijó', latitud: -0.94027, longitud: -80.63878 },
  { id: 11, nombre: 'Crucita', latitud: -0.87849, longitud: -80.54214 },
  { id: 12, nombre: 'Bahía de Caráquez', latitud: -0.60030, longitud: -80.42370 },
  { id: 13, nombre: 'San Vicente', latitud: -0.59310, longitud: -80.40800 },
  { id: 14, nombre: 'Jama', latitud: -0.20308, longitud: -80.26453 },
  { id: 15, nombre: 'Pedernales', latitud: 0.07117, longitud: -80.05275 },
  { id: 16, nombre: 'Flavio Alfaro', latitud: -0.40526, longitud: -79.90395 },
  { id: 17, nombre: 'El Carmen', latitud: -0.26730, longitud: -79.45932 },
  { id: 18, nombre: 'Pichincha, Manabí', latitud: -1.04645, longitud: -79.81757 },
  { id: 19, nombre: 'Santa Ana', latitud: -1.20731, longitud: -80.37114 },
  { id: 20, nombre: '24 de Mayo', latitud: -1.27823, longitud: -80.41803 },
  { id: 21, nombre: 'Jipijapa', latitud: -1.34872, longitud: -80.57875 },
  { id: 22, nombre: 'Paján', latitud: -1.55202, longitud: -80.42883 },
  { id: 23, nombre: 'Puerto López', latitud: -1.55284, longitud: -80.81286 },
  { id: 24, nombre: 'Quevedo', latitud: -1.02217, longitud: -79.46046 },
  { id: 25, nombre: 'Santo Domingo', latitud: -0.25305, longitud: -79.17536 },
  { id: 26, nombre: 'Quito', latitud: -0.18065, longitud: -78.46784 },
  { id: 27, nombre: 'Guayaquil', latitud: -2.17099, longitud: -79.92236 },
  { id: 28, nombre: 'Esmeraldas', latitud: 0.96818, longitud: -79.65172 },
  { id: 29, nombre: 'Babahoyo', latitud: -1.80193, longitud: -79.53465 },
  { id: 30, nombre: 'Daule', latitud: -1.86218, longitud: -79.97767 },
];

const categories = [
  ['Computadoras', 'Equipos de escritorio, portátiles y estaciones de trabajo.'],
  ['Componentes', 'Procesadores, memorias, tarjetas y componentes internos.'],
  ['Periféricos', 'Teclados, ratones, cámaras y accesorios de entrada.'],
  ['Monitores', 'Pantallas para oficina, diseño y uso profesional.'],
  ['Redes', 'Routers, switches, puntos de acceso y cableado.'],
  ['Almacenamiento', 'Discos duros, SSD y unidades externas.'],
  ['Impresión', 'Impresoras, escáneres y suministros de impresión.'],
  ['Energía', 'UPS, reguladores, baterías y protección eléctrica.'],
  ['Audio y video', 'Auriculares, parlantes, proyectores y accesorios multimedia.'],
  ['Movilidad', 'Tablets, soportes, cargadores y accesorios móviles.'],
  ['Seguridad electrónica', 'Cámaras, grabadores, sensores y control de acceso.'],
  ['Accesorios y consumibles', 'Cables, adaptadores, repuestos y consumibles.'],
];

const productNames = [
  ['Laptop empresarial 15 pulgadas', 'Mini PC empresarial', 'Estación de trabajo', 'Laptop ultraligera', 'PC de escritorio', 'All in One'],
  ['Memoria RAM 16 GB', 'Procesador gama media', 'Tarjeta gráfica profesional', 'Placa base empresarial', 'Fuente 650 W', 'Kit de refrigeración'],
  ['Teclado inalámbrico', 'Ratón ergonómico', 'Cámara web Full HD', 'Combo teclado y ratón', 'Lector de códigos', 'Hub USB-C'],
  ['Monitor 24 pulgadas', 'Monitor 27 pulgadas', 'Monitor ultrawide', 'Monitor portátil', 'Soporte doble monitor', 'Pantalla profesional 4K'],
  ['Router Wi-Fi 6', 'Switch 8 puertos', 'Switch 24 puertos', 'Punto de acceso', 'Bobina cable UTP', 'Adaptador de red USB'],
  ['SSD 1 TB', 'SSD 500 GB', 'Disco duro 2 TB', 'Unidad externa 2 TB', 'Memoria USB 128 GB', 'NAS de 2 bahías'],
  ['Impresora láser', 'Impresora multifunción', 'Escáner de documentos', 'Impresora térmica', 'Tóner negro', 'Kit de mantenimiento'],
  ['UPS 1200 VA', 'Regulador 1000 VA', 'Batería para UPS', 'Protector de voltaje', 'PDU de 8 tomas', 'UPS 2200 VA'],
  ['Auriculares USB', 'Parlantes de escritorio', 'Proyector empresarial', 'Micrófono USB', 'Barra de videoconferencia', 'Capturadora HDMI'],
  ['Tablet 10 pulgadas', 'Cargador USB-C 65 W', 'Base para laptop', 'Power bank 20000 mAh', 'Soporte para tablet', 'Mochila tecnológica'],
  ['Cámara IP interior', 'Cámara IP exterior', 'Grabador NVR', 'Kit de videovigilancia', 'Sensor de apertura', 'Control de acceso biométrico'],
  ['Cable HDMI 2 metros', 'Adaptador USB-C a HDMI', 'Cable de red Cat 6', 'Pasta térmica', 'Kit de limpieza', 'Organizador de cables'],
];

function buildProducts() {
  const rows = [];
  let id = 1;

  productNames.forEach((names, categoryIndex) => {
    names.forEach((nombre, localIndex) => {
      const purchase = 12 + categoryIndex * 23 + localIndex * 16;
      const sale = round2(purchase * 1.28);

      rows.push({
        id,
        categoria_id: categoryIndex + 1,
        codigo: `PRD-${pad(categoryIndex + 1)}-${pad(localIndex + 1)}`,
        nombre,
        descripcion: `${nombre} para operaciones comerciales y empresariales.`,
        precio_compra: purchase,
        precio_venta: sale,
        stock_actual: 90 + ((id * 11) % 110),
        stock_minimo: 12,
        stock_maximo: 300,
        estado: id !== 72,
      });

      id += 1;
    });
  });

  return rows;
}

function buildClients() {
  const commercialNames = [
    'Soluciones Digitales',
    'Tecnología Integral',
    'Comercial Informático',
    'Sistemas Empresariales',
    'Conexión Tecnológica',
    'Innovación Computacional',
    'Servicios Corporativos',
    'Equipamiento Profesional',
  ];

  return Array.from({ length: 48 }, (_, index) => {
    const id = index + 1;
    const locationId = 2 + ((id - 1) % 29);
    const location = locations.find((item) => item.id === locationId);
    const prefix = commercialNames[(id - 1) % commercialNames.length];

    return {
      id,
      nombre: `${prefix} ${location.nombre} ${Math.ceil(id / 29)}`,
      identificacion: `13${String(10000000 + id).padStart(8, '0')}`,
      telefono: `09${String(81000000 + id).padStart(8, '0')}`,
      correo: `cliente${pad(id)}@demo.techsupply.ec`,
      direccion: `Zona comercial ${id}, ${location.nombre}`,
      ubicacion_id: locationId,
      estado: id !== 48,
    };
  });
}

const mandatoryEdges = [
  [1, 2], [1, 3], [1, 4], [3, 5], [5, 16], [16, 17],
  [17, 25], [25, 26], [25, 28], [17, 24], [24, 29], [29, 27],
  [27, 30], [24, 18], [18, 19], [19, 7], [7, 6], [6, 11],
  [11, 10], [10, 8], [8, 9], [7, 20], [20, 21], [21, 22],
  [21, 23], [6, 12], [12, 13], [13, 14], [14, 15],
];

function buildRoutes(neighborCount = 4) {
  const undirected = new Map();

  function addEdge(origin, destination) {
    if (origin.id === destination.id) return;
    const low = Math.min(origin.id, destination.id);
    const high = Math.max(origin.id, destination.id);
    const key = `${low}-${high}`;

    if (!undirected.has(key)) {
      undirected.set(key, {
        a: low,
        b: high,
        distance: Math.max(0.5, round2(haversineKm(origin, destination))),
      });
    }
  }

  for (const origin of locations) {
    const nearest = locations
      .filter((candidate) => candidate.id !== origin.id)
      .map((candidate) => ({
        candidate,
        distance: haversineKm(origin, candidate),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, neighborCount);

    for (const { candidate } of nearest) {
      addEdge(origin, candidate);
    }
  }

  for (const [originId, destinationId] of mandatoryEdges) {
    const origin = locations.find((item) => item.id === originId);
    const destination = locations.find((item) => item.id === destinationId);
    addEdge(origin, destination);
  }

  const rows = [];
  let id = 1;

  for (const edge of undirected.values()) {
    rows.push({
      id: id++,
      origen_id: edge.a,
      destino_id: edge.b,
      distancia_km: edge.distance,
    });
    rows.push({
      id: id++,
      origen_id: edge.b,
      destino_id: edge.a,
      distancia_km: edge.distance,
    });
  }

  return rows;
}

const specialOrderClientIds = new Map([
  [53, 25],
  [54, 26],
  [55, 24],
  [56, 23],
  [57, 27],
]);

function clientIdForOrder(orderId) {
  return specialOrderClientIds.get(orderId) || (((orderId - 1) % 48) + 1);
}

function clientLocationId(orderId) {
  const clientId = clientIdForOrder(orderId);
  return 2 + ((clientId - 1) % 29);
}

function orderStateForId(id) {
  if (id <= 12) return 'PENDIENTE';
  if (id <= 24) return 'PREPARANDO';
  if (id <= 52) return 'LISTO_PARA_DESPACHO';
  if (id <= 57) return 'DESPACHADO';
  if (id <= 63) return 'ENTREGADO';
  if (id <= 67) return 'REPROGRAMADO';
  if (id <= 70) return 'ENTREGADO';
  return 'CANCELADO';
}

function orderCreatedOffset(id) {
  if (id <= 12) return -(id % 3);
  if (id <= 24) return -1;
  if (id <= 52) return -2;
  if (id <= 57) return -3;
  if (id <= 67) return -6;
  if (id <= 70) return -11;
  return -2;
}

function buildJourneyRoute(orderIds) {
  const warehouse = locations.find((item) => item.id === 1);
  const points = orderIds.map((orderId, index) => {
    const location = locations.find(
      (item) => item.id === clientLocationId(orderId),
    );

    return {
      orden: index + 1,
      pedido_id: orderId,
      ubicacion_id: location.id,
      nombre: location.nombre,
      latitud: location.latitud,
      longitud: location.longitud,
    };
  });

  const routeNodes = [warehouse, ...points, warehouse];
  const segments = [];
  let totalDistance = 0;
  let totalTravelMinutes = 0;

  for (let index = 0; index < routeNodes.length - 1; index += 1) {
    const origin = routeNodes[index];
    const destination = routeNodes[index + 1];
    const distance = round2(haversineKm(origin, destination));
    const minutes = Math.max(5, Math.round((distance / 55) * 60));
    totalDistance += distance;
    totalTravelMinutes += minutes;

    segments.push({
      orden: index + 1,
      origen: {
        id: origin.id || origin.ubicacion_id,
        nombre: origin.nombre,
        latitud: origin.latitud,
        longitud: origin.longitud,
      },
      destino: {
        id: destination.id || destination.ubicacion_id,
        nombre: destination.nombre,
        latitud: destination.latitud,
        longitud: destination.longitud,
      },
      distancia_km: distance,
      tiempo_estimado_min: minutes,
      geometria: [
        [origin.latitud, origin.longitud],
        [destination.latitud, destination.longitud],
      ],
    });
  }

  return {
    route: {
      bodega: {
        id: warehouse.id,
        nombre: warehouse.nombre,
        latitud: warehouse.latitud,
        longitud: warehouse.longitud,
      },
      puntos: points,
      geometria: routeNodes.map((node) => [node.latitud, node.longitud]),
      tramos: segments,
    },
    points,
    segments,
    totalDistance: round2(totalDistance),
    totalTravelMinutes,
  };
}

function calculateOperationalMinutes(travelMinutes, deliveryCount) {
  const base =
    Number(travelMinutes) +
    Number(deliveryCount) * SERVICE_MINUTES_PER_DELIVERY;

  return Math.ceil(
    base * (1 + OPERATING_MARGIN_PERCENT / 100),
  );
}

function buildJourneyDefinitions() {
  const basic = [
    {
      id: 1,
      truck: 1,
      driver: 1,
      orderIds: [41, 42, 43, 44],
      date: dateOnlyOffset(0),
      startEstimated: atTimezoneOffset(0, 8, 30),
      startReal: null,
      endReal: null,
      state: 'PLANIFICADA',
      currentOrder: 0,
      loadingUser: null,
      loadingAt: null,
      loadMode: 'PARTIAL',
    },
    {
      id: 2,
      truck: 2,
      driver: 2,
      orderIds: [45, 46, 47, 48],
      date: dateOnlyOffset(0),
      startEstimated: atTimezoneOffset(0, 9, 0),
      startReal: null,
      endReal: null,
      state: 'PLANIFICADA',
      currentOrder: 0,
      loadingUser: 5,
      loadingAt: atTimezoneOffset(0, 7, 45),
      loadMode: 'COMPLETE',
    },
    {
      id: 3,
      truck: 3,
      driver: 3,
      orderIds: [53, 54, 55, 56, 57],
      date: dateOnlyOffset(-1),
      startEstimated: atTimezoneOffset(-1, 8, 0),
      startReal: atTimezoneOffset(-1, 8, 20),
      endReal: null,
      state: 'EN_RUTA',
      currentOrder: 1,
      loadingUser: 6,
      loadingAt: atTimezoneOffset(-1, 7, 15),
      loadMode: 'COMPLETE',
    },
    {
      id: 4,
      truck: 4,
      driver: 4,
      orderIds: [58, 59, 60, 61, 62, 63, 64, 65, 66, 67],
      date: dateOnlyOffset(-5),
      startEstimated: atTimezoneOffset(-5, 8, 0),
      startReal: atTimezoneOffset(-5, 8, 10),
      endReal: null,
      state: 'FINALIZADA',
      currentOrder: 10,
      loadingUser: 5,
      loadingAt: atTimezoneOffset(-5, 7, 10),
      loadMode: 'COMPLETE',
    },
    {
      id: 5,
      truck: 5,
      driver: 5,
      orderIds: [68, 69, 70],
      date: dateOnlyOffset(-10),
      startEstimated: atTimezoneOffset(-10, 8, 0),
      startReal: atTimezoneOffset(-10, 8, 5),
      endReal: null,
      state: 'FINALIZADA',
      currentOrder: 3,
      loadingUser: 6,
      loadingAt: atTimezoneOffset(-10, 7, 15),
      loadMode: 'COMPLETE',
    },
    {
      id: 6,
      truck: 6,
      driver: 6,
      orderIds: [],
      date: dateOnlyOffset(-2),
      startEstimated: atTimezoneOffset(-2, 8, 0),
      startReal: null,
      endReal: null,
      state: 'CANCELADA',
      currentOrder: 0,
      loadingUser: null,
      loadingAt: null,
      loadMode: 'NONE',
    },
    {
      id: 7,
      truck: 7,
      driver: 6,
      orderIds: [49, 50, 51, 52],
      date: dateOnlyOffset(0),
      startEstimated: atTimezoneOffset(0, 10, 0),
      startReal: null,
      endReal: null,
      state: 'PLANIFICADA',
      currentOrder: 0,
      loadingUser: null,
      loadingAt: null,
      loadMode: 'NONE',
    },
  ];

  return basic.map((definition) => {
    const metrics = definition.orderIds.length
      ? buildJourneyRoute(definition.orderIds)
      : {
          route: null,
          points: [],
          segments: [],
          totalDistance: 0,
          totalTravelMinutes: 0,
        };
    const operationalMinutes = calculateOperationalMinutes(
      metrics.totalTravelMinutes,
      definition.orderIds.length,
    );
    const returnEstimated = addOperatingMinutes(
      definition.startEstimated,
      operationalMinutes,
    );
    const endReal = definition.state === 'FINALIZADA'
      ? addOperatingMinutes(
          definition.startReal,
          operationalMinutes + (definition.id === 4 ? 35 : -10),
        )
      : definition.endReal;

    return {
      ...definition,
      ...metrics,
      operationalMinutes,
      returnEstimated,
      endReal,
    };
  });
}

function buildDispatchDefinitions() {
  const journeys = buildJourneyDefinitions();
  const rows = [];
  let id = 1;

  for (const journey of journeys) {
    if (!journey.orderIds.length) continue;

    let cumulativeTravelMinutes = 0;

    journey.orderIds.forEach((orderId, index) => {
      const segment = journey.segments[index];
      cumulativeTravelMinutes += segment.tiempo_estimado_min;
      const baseArrivalMinutes =
        cumulativeTravelMinutes +
        index * SERVICE_MINUTES_PER_DELIVERY;
      const estimatedMinutes = Math.ceil(
        baseArrivalMinutes * (1 + OPERATING_MARGIN_PERCENT / 100),
      );
      const estimatedDelivery = addOperatingMinutes(
        journey.startEstimated,
        estimatedMinutes,
      );

      let state = 'PENDIENTE';
      if (journey.state === 'EN_RUTA') state = 'EN_TRANSITO';
      if (journey.id === 4) {
        state = orderId <= 63 ? 'ENTREGADO' : 'NO_ENTREGADO';
      }
      if (journey.id === 5) state = 'ENTREGADO';

      const loaded = journey.loadMode === 'COMPLETE'
        || (journey.loadMode === 'PARTIAL' && index < 2);
      const loadingAt = loaded
        ? addMinutes(journey.startEstimated, -50 + index * 5)
        : null;
      const deliveredAt = state === 'ENTREGADO'
        ? addMinutes(estimatedDelivery, ((orderId % 3) - 1) * 12)
        : null;

      rows.push({
        id: id++,
        pedido_id: orderId,
        jornada_reparto_id: journey.id,
        orden_entrega: index + 1,
        fecha_estimada_entrega: estimatedDelivery,
        fecha_salida: journey.startReal,
        fecha_entrega: deliveredAt,
        estado: state,
        cargado: loaded,
        cargado_por_usuario_id: loaded ? (orderId % 2 === 0 ? 5 : 6) : null,
        fecha_carga: loadingAt,
        ruta_json: {
          tipo: 'TRAMO_DESPACHO',
          origen: segment.origen,
          destino: segment.destino,
          geometria: segment.geometria,
        },
        distancia_total: segment.distancia_km,
        tiempo_estimado: segment.tiempo_estimado_min,
        created_at: loadingAt || journey.startEstimated,
        updated_at: deliveredAt || journey.startReal || loadingAt || journey.startEstimated,
      });
    });
  }

  return rows;
}

function deliveredAtForOrder(orderId) {
  const dispatch = buildDispatchDefinitions().find(
    (item) => item.pedido_id === orderId && item.estado === 'ENTREGADO',
  );
  return dispatch?.fecha_entrega || null;
}

module.exports = {
  TIMEZONE,
  OPERATION_MINUTES_PER_DAY,
  SERVICE_MINUTES_PER_DELIVERY,
  OPERATING_MARGIN_PERCENT,
  locations,
  categories,
  buildProducts,
  buildClients,
  buildRoutes,
  buildJourneyRoute,
  buildJourneyDefinitions,
  buildDispatchDefinitions,
  clientIdForOrder,
  clientLocationId,
  orderStateForId,
  orderCreatedOffset,
  deliveredAtForOrder,
  atTimezoneOffset,
  dateOnlyOffset,
  dateOnlyInTimezone,
  addMinutes,
  addOperatingMinutes,
  haversineKm,
  calculateOperationalMinutes,
};
