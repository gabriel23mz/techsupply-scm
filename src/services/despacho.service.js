import Despacho from '../models/Despacho.js';
import Pedido from '../models/Pedido.js';
import Cliente from '../models/Cliente.js';
import Usuario from '../models/Usuario.js';
import Ubicacion from '../models/Ubicacion.js';
import JornadaReparto from '../models/JornadaReparto.js';
import sequelize from '../config/database.js';

import * as n8nService from './n8n.service.js';

import {
  BusinessRuleError,
  NotFoundError,
} from '../utils/errors.js';

function normalizeRouteJson(value) {
  if (!value) {
    return {};
  }

  /*
   * PostgreSQL devuelve ruta_json como JSONB.
   * Esta normalización mantiene compatibilidad con valores
   * históricos que puedan llegar serializados como texto.
   */
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

async function actualizarPosicionJornadaSiCorresponde(
  jornada,
  transaction,
) {
  const despachos = await Despacho.findAll({
    where: {
      jornada_reparto_id: jornada.id,
    },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  const posicionActual = Number(
    jornada.posicion_actual_orden,
  );

  const despachosPuntoActual =
    despachos.filter(
      (item) =>
        Number(item.orden_entrega) ===
        posicionActual,
    );

  const estadosCerrados = [
    'ENTREGADO',
    'NO_ENTREGADO',
    'CANCELADO',
  ];

  const puntoActualCerrado =
    despachosPuntoActual.length > 0 &&
    despachosPuntoActual.every(
      (item) =>
        estadosCerrados.includes(
          item.estado,
        ),
    );

  if (!puntoActualCerrado) {
    return;
  }

  const ordenesPendientes = despachos
    .filter(
      (item) =>
        Number(item.orden_entrega) >
          posicionActual &&
        item.estado === 'EN_TRANSITO',
    )
    .map((item) => Number(item.orden_entrega));

  if (!ordenesPendientes.length) {
    return;
  }

  await jornada.update(
    {
      posicion_actual_orden:
        Math.min(...ordenesPendientes),
    },
    {
      transaction,
    },
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

  const despachoEnriquecido =
    await enriquecerDespacho(despacho);

  if (!despachoEnriquecido) {
    throw new NotFoundError(
      'Despacho no encontrado',
      'DESPACHO_NO_ENCONTRADO',
    );
  }

  return despachoEnriquecido;
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
    throw new NotFoundError(
      'Despacho no encontrado',
      'DESPACHO_NO_ENCONTRADO',
    );
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
    throw new NotFoundError(
      'Despacho no encontrado',
      'DESPACHO_NO_ENCONTRADO',
    );
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
    throw new NotFoundError(
      'Despacho no encontrado',
      'DESPACHO_NO_ENCONTRADO',
    );
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
  /*
   * Invariante:
   * Un despacho solo puede entregarse cuando corresponde
   * a la posición actual de la jornada.
   */
  await sequelize.transaction(
    async (transaction) => {
      const despacho = await Despacho.findByPk(
        id,
        {
          transaction,
          lock: transaction.LOCK.UPDATE,
        },
      );

      if (!despacho) {
        throw new NotFoundError(
          'Despacho no encontrado',
          'DESPACHO_NO_ENCONTRADO',
        );
      }

      const jornada =
        await JornadaReparto.findByPk(
          despacho.jornada_reparto_id,
          {
            transaction,
            lock: transaction.LOCK.UPDATE,
          },
        );

      if (!jornada) {
        throw new BusinessRuleError(
          'El despacho no está asociado a una jornada de reparto',
          'DESPACHO_SIN_JORNADA',
        );
      }

      const pedido = await Pedido.findByPk(
        despacho.pedido_id,
        {
          transaction,
          lock: transaction.LOCK.UPDATE,
        },
      );

      if (!pedido) {
        throw new NotFoundError(
          'Pedido no encontrado',
          'PEDIDO_NO_ENCONTRADO',
        );
      }

      if (jornada.estado !== 'EN_RUTA') {
        throw new BusinessRuleError(
          'La jornada debe estar EN_RUTA para entregar despachos',
          'JORNADA_NO_EN_RUTA',
        );
      }

      if (despacho.estado !== 'EN_TRANSITO') {
        throw new BusinessRuleError(
          'Solo se pueden entregar despachos en estado EN_TRANSITO',
          'DESPACHO_ESTADO_INVALIDO_ENTREGA',
        );
      }

      if (
        Number(despacho.orden_entrega) !==
        Number(jornada.posicion_actual_orden)
      ) {
        throw new BusinessRuleError(
          'El camión aún no se encuentra en el punto de entrega de este despacho',
          'DESPACHO_FUERA_DE_ORDEN',
        );
      }

      const fechaEntrega = new Date();

      await despacho.update(
        {
          estado: 'ENTREGADO',
          fecha_entrega: fechaEntrega,
        },
        {
          transaction,
        },
      );

      await pedido.update(
        {
          estado: 'ENTREGADO',
        },
        {
          transaction,
        },
      );

      await actualizarPosicionJornadaSiCorresponde(
        jornada,
        transaction,
      );
    },
  );

  const resultado = await obtenerPorId(id);

  /*
   * n8n se ejecuta después del commit para que un fallo
   * de notificación no revierta la entrega confirmada.
   */
  await n8nService
    .despachoEntregado(resultado)
    .catch(console.error);

  return resultado;
};

export const marcarNoEntregado = async (id) => {
  /*
   * Invariante:
   * La no entrega avanza la jornada y reprograma el pedido
   * de forma atómica.
   */
  await sequelize.transaction(
    async (transaction) => {
      const despacho = await Despacho.findByPk(
        id,
        {
          transaction,
          lock: transaction.LOCK.UPDATE,
        },
      );

      if (!despacho) {
        throw new NotFoundError(
          'Despacho no encontrado',
          'DESPACHO_NO_ENCONTRADO',
        );
      }

      const jornada =
        await JornadaReparto.findByPk(
          despacho.jornada_reparto_id,
          {
            transaction,
            lock: transaction.LOCK.UPDATE,
          },
        );

      if (!jornada) {
        throw new BusinessRuleError(
          'El despacho no está asociado a una jornada de reparto',
          'DESPACHO_SIN_JORNADA',
        );
      }

      const pedido = await Pedido.findByPk(
        despacho.pedido_id,
        {
          transaction,
          lock: transaction.LOCK.UPDATE,
        },
      );

      if (!pedido) {
        throw new NotFoundError(
          'Pedido no encontrado',
          'PEDIDO_NO_ENCONTRADO',
        );
      }

      if (jornada.estado !== 'EN_RUTA') {
        throw new BusinessRuleError(
          'La jornada debe estar EN_RUTA para marcar un despacho como no entregado',
          'JORNADA_NO_EN_RUTA',
        );
      }

      if (despacho.estado !== 'EN_TRANSITO') {
        throw new BusinessRuleError(
          'Solo se pueden marcar como no entregados despachos en estado EN_TRANSITO',
          'DESPACHO_ESTADO_INVALIDO_NO_ENTREGA',
        );
      }

      if (
        Number(despacho.orden_entrega) !==
        Number(jornada.posicion_actual_orden)
      ) {
        throw new BusinessRuleError(
          'El camión aún no se encuentra en el punto de entrega de este despacho',
          'DESPACHO_FUERA_DE_ORDEN',
        );
      }

      const fechaEntrega = new Date();

      await despacho.update(
        {
          estado: 'NO_ENTREGADO',
          fecha_entrega: fechaEntrega,
        },
        {
          transaction,
        },
      );

      await pedido.update(
        {
          estado: 'REPROGRAMADO',
        },
        {
          transaction,
        },
      );

      await actualizarPosicionJornadaSiCorresponde(
        jornada,
        transaction,
      );
    },
  );

  const resultado = await obtenerPorId(id);

  /*
   * n8n se ejecuta después del commit para que un fallo
   * de notificación no revierta la operación logística.
   */
  await n8nService
    .despachoNoEntregado(resultado)
    .catch(console.error);

  return resultado;
};
