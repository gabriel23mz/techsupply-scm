import Despacho from '../models/Despacho.js';
import Pedido from '../models/Pedido.js';
import Cliente from '../models/Cliente.js';
import Usuario from '../models/Usuario.js';
import Ubicacion from '../models/Ubicacion.js';
import JornadaReparto from '../models/JornadaReparto.js';

function normalizeRouteJson(value) {
  if (!value) {
    return {};
  }

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function getRouteNodeIds(routeJson) {
  const candidates = [
    routeJson.ruta_nodos,
    routeJson.nodos,
    routeJson.ruta,
  ];

  const nodes = candidates.find(Array.isArray);

  if (!nodes) {
    return [];
  }

  return nodes
    .map((node) =>
      typeof node === 'object'
        ? node.id
        : node,
    )
    .filter((id) => id !== null && id !== undefined);
}

async function obtenerRutaDetalle(routeJson) {
  const routeNodeIds = getRouteNodeIds(routeJson);

  const explicitOrigin =
    routeJson.desde ??
    routeJson.origen ??
    null;

  const explicitDestination =
    routeJson.hasta ??
    routeJson.destino ??
    null;

  const allIds = [
    ...routeNodeIds,
    explicitOrigin?.id,
    explicitDestination?.id,
  ].filter(
    (id, index, array) =>
      id !== null &&
      id !== undefined &&
      array.indexOf(id) === index,
  );

  let locationsMap = new Map();

  if (allIds.length) {
    const locations = await Ubicacion.findAll({
      where: {
        id: allIds,
      },
      attributes: [
        'id',
        'nombre',
        'latitud',
        'longitud',
      ],
    });

    locationsMap = new Map(
      locations.map((location) => [
        Number(location.id),
        location.toJSON(),
      ]),
    );
  }

  const detail = routeNodeIds.map((id) => {
    const location = locationsMap.get(Number(id));

    return {
      id,
      nombre:
        location?.nombre ??
        `Ubicación ${id}`,
      latitud:
        location?.latitud ?? null,
      longitud:
        location?.longitud ?? null,
    };
  });

  const originId = explicitOrigin?.id;
  const destinationId = explicitDestination?.id;

  if (
    explicitOrigin &&
    (!detail.length ||
      Number(detail[0]?.id) !== Number(originId))
  ) {
    detail.unshift({
      id: originId ?? 'origen',
      nombre:
        explicitOrigin.nombre ??
        locationsMap.get(Number(originId))?.nombre ??
        'Origen',
      latitud:
        explicitOrigin.latitud ??
        explicitOrigin.lat ??
        locationsMap.get(Number(originId))?.latitud ??
        null,
      longitud:
        explicitOrigin.longitud ??
        explicitOrigin.lon ??
        explicitOrigin.lng ??
        locationsMap.get(Number(originId))?.longitud ??
        null,
    });
  }

  if (
    explicitDestination &&
    (!detail.length ||
      Number(detail.at(-1)?.id) !== Number(destinationId))
  ) {
    detail.push({
      id: destinationId ?? 'destino',
      nombre:
        explicitDestination.nombre ??
        locationsMap.get(Number(destinationId))?.nombre ??
        'Destino',
      latitud:
        explicitDestination.latitud ??
        explicitDestination.lat ??
        locationsMap.get(Number(destinationId))?.latitud ??
        null,
      longitud:
        explicitDestination.longitud ??
        explicitDestination.lon ??
        explicitDestination.lng ??
        locationsMap.get(Number(destinationId))?.longitud ??
        null,
    });
  }

  return detail;
}

function buildRouteSummary(
  routeJson,
  routeDetail,
  plainDispatch,
) {
  const geometry = Array.isArray(routeJson.geometria)
    ? routeJson.geometria
    : [];

  const origin =
    routeJson.desde?.nombre ??
    routeJson.origen?.nombre ??
    routeDetail[0]?.nombre ??
    null;

  const destination =
    routeJson.hasta?.nombre ??
    routeJson.destino?.nombre ??
    routeDetail.at(-1)?.nombre ??
    plainDispatch?.Pedido?.Cliente?.Ubicacion?.nombre ??
    null;

  return {
    tipo: 'TRAMO_DESPACHO',
    origen: origin,
    destino: destination,
    total_nodos: routeDetail.length,
    tiene_geometria: geometry.length > 0,
    total_coordenadas: geometry.length,
  };
}

async function enriquecerDespacho(despacho) {
  if (!despacho) {
    return null;
  }

  const plainDispatch =
    typeof despacho.toJSON === 'function'
      ? despacho.toJSON()
      : despacho;

  const routeJson = normalizeRouteJson(
    plainDispatch.ruta_json,
  );

  const routeDetail =
    await obtenerRutaDetalle(routeJson);

  const routeSummary = buildRouteSummary(
    routeJson,
    routeDetail,
    plainDispatch,
  );

  return {
    ...plainDispatch,
    ruta_json: routeJson,
    ruta_detalle: routeDetail,
    ruta_resumen: routeSummary,
  };
}

async function enriquecerDespachos(despachos) {
  return Promise.all(
    despachos.map(enriquecerDespacho),
  );
}

const includeRelations = [
  {
    model: JornadaReparto,
    as: 'jornada',
    attributes: [
      'id',
      'camion_id',
      'fecha',
      'estado',
      'posicion_actual_orden',
      'distancia_total',
      'tiempo_estimado',
    ],
    required: false,
  },
  {
    model: Pedido,
    include: [
      {
        model: Cliente,
        attributes: [
          'id',
          'nombre',
          'identificacion',
          'telefono',
          'correo',
          'direccion',
          'ubicacion_id',
        ],
        include: [
          {
            model: Ubicacion,
            attributes: [
              'id',
              'nombre',
              'latitud',
              'longitud',
            ],
            required: false,
          },
        ],
      },
      {
        model: Usuario,
        attributes: [
          'id',
          'nombre',
          'apellido',
          'rol',
        ],
      },
    ],
  },
];

export const obtenerTodos = async () => {
  const despachos = await Despacho.findAll({
    include: includeRelations,
    order: [['id', 'DESC']],
  });

  return enriquecerDespachos(despachos);
};

export const obtenerPorId = async (id) => {
  const despacho = await Despacho.findByPk(id, {
    include: includeRelations,
  });

  return enriquecerDespacho(despacho);
};

export const crear = async ({
  pedido_id,
  ruta_json,
  distancia_total,
  tiempo_estimado,
}) => {
  const despacho = await Despacho.create({
    pedido_id,
    estado: 'PENDIENTE',
    ruta_json,
    distancia_total,
    tiempo_estimado,
  });

  return obtenerPorId(despacho.id);
};

export const iniciar = async (id) => {
  const despacho = await Despacho.findByPk(id);

  if (!despacho) {
    return null;
  }

  await despacho.update({
    estado: 'EN_TRANSITO',
    fecha_salida: new Date(),
  });

  return obtenerPorId(id);
};

export const entregar = async (id) => {
  const despacho = await Despacho.findByPk(id);

  if (!despacho) {
    return null;
  }

  await despacho.update({
    estado: 'ENTREGADO',
    fecha_entrega: new Date(),
  });

  return obtenerPorId(id);
};

export const cancelar = async (id) => {
  const despacho = await Despacho.findByPk(id);

  if (!despacho) {
    return null;
  }

  await despacho.update({
    estado: 'CANCELADO',
  });

  return obtenerPorId(id);
};

export const existeDespachoActivo = async (
  pedidoId,
) => {
  return Despacho.findOne({
    where: {
      pedido_id: pedidoId,
      estado: [
        'PENDIENTE',
        'EN_TRANSITO',
      ],
    },
  });
};

export const entregarDespacho = async (id) => {
  const despacho = await Despacho.findByPk(id, {
    include: [
      {
        model: JornadaReparto,
        as: 'jornada',
      },
      {
        model: Pedido,
      },
    ],
  });

  if (!despacho) {
    throw new Error('Despacho no encontrado');
  }

  if (!despacho.jornada) {
    throw new Error(
      'El despacho no está asociado a una jornada de reparto',
    );
  }

  if (despacho.jornada.estado !== 'EN_RUTA') {
    throw new Error(
      'La jornada debe estar EN_RUTA para entregar despachos',
    );
  }

  if (despacho.estado !== 'EN_TRANSITO') {
    throw new Error(
      'Solo se pueden entregar despachos en estado EN_TRANSITO',
    );
  }

  if (
    Number(despacho.orden_entrega) !==
    Number(
      despacho.jornada.posicion_actual_orden,
    )
  ) {
    throw new Error(
      'El camión aún no se encuentra en el punto de entrega de este despacho',
    );
  }

  await despacho.update({
    estado: 'ENTREGADO',
    fecha_entrega: new Date(),
  });

  await Pedido.update(
    { estado: 'ENTREGADO' },
    {
      where: {
        id: despacho.pedido_id,
      },
    },
  );

  return obtenerPorId(id);
};

export const marcarNoEntregado = async (id) => {
  const despacho = await Despacho.findByPk(id, {
    include: [
      {
        model: JornadaReparto,
        as: 'jornada',
      },
      {
        model: Pedido,
      },
    ],
  });

  if (!despacho) {
    throw new Error('Despacho no encontrado');
  }

  if (!despacho.jornada) {
    throw new Error(
      'El despacho no está asociado a una jornada de reparto',
    );
  }

  if (despacho.jornada.estado !== 'EN_RUTA') {
    throw new Error(
      'La jornada debe estar EN_RUTA para marcar un despacho como no entregado',
    );
  }

  if (despacho.estado !== 'EN_TRANSITO') {
    throw new Error(
      'Solo se pueden marcar como no entregados despachos en estado EN_TRANSITO',
    );
  }

  if (
    Number(despacho.orden_entrega) !==
    Number(
      despacho.jornada.posicion_actual_orden,
    )
  ) {
    throw new Error(
      'El camión aún no se encuentra en el punto de entrega de este despacho',
    );
  }

  await despacho.update({
    estado: 'NO_ENTREGADO',
    fecha_entrega: new Date(),
  });

  await Pedido.update(
    { estado: 'REPROGRAMADO' },
    {
      where: {
        id: despacho.pedido_id,
      },
    },
  );

  return obtenerPorId(id);
};
