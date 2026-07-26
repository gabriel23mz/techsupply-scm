import {
  Op,
  col,
  where as sequelizeWhere,
} from 'sequelize';

import db from '../../models/index.js';

import {
  DASHBOARD_ACCESS,
  DASHBOARD_LEVELS,
  DASHBOARD_NOTIFICATION_TYPES,
} from '../../constants/dashboard.js';

import {
  getOperationalDate,
} from '../../utils/logisticTime.js';

import {
  notification,
  sortNotifications,
  toPlain,
} from './dashboard.shared.js';

const {
  Producto,
  Pedido,
  Despacho,
  Camion,
  JornadaReparto,
  Chofer,
  OrdenCompra,
} = db;

const lowStockCondition = sequelizeWhere(
  col('stock_actual'),
  Op.lte,
  col('stock_minimo'),
);

const mapSalesOrderNotification = (order) => {
  const plain = toPlain(order);

  const definitions = {
    PREPARANDO: {
      nivel: DASHBOARD_LEVELS.INFO,
      titulo: 'Pedido en preparación',
      mensaje: `El pedido PED-${String(plain.id).padStart(5, '0')} fue recibido por bodega.`,
    },
    LISTO_PARA_DESPACHO: {
      nivel: DASHBOARD_LEVELS.SUCCESS,
      titulo: 'Pedido preparado',
      mensaje: `El pedido PED-${String(plain.id).padStart(5, '0')} está listo para planificación.`,
    },
    DESPACHADO: {
      nivel: DASHBOARD_LEVELS.INFO,
      titulo: 'Pedido despachado',
      mensaje: `El pedido PED-${String(plain.id).padStart(5, '0')} se encuentra en ruta.`,
    },
    ENTREGADO: {
      nivel: DASHBOARD_LEVELS.SUCCESS,
      titulo: 'Pedido entregado',
      mensaje: `El pedido PED-${String(plain.id).padStart(5, '0')} fue entregado.`,
    },
    REPROGRAMADO: {
      nivel: DASHBOARD_LEVELS.WARNING,
      titulo: 'Pedido reprogramado',
      mensaje: `El pedido PED-${String(plain.id).padStart(5, '0')} requiere una nueva planificación.`,
    },
  };

  const definition = definitions[plain.estado] ?? {
    nivel: DASHBOARD_LEVELS.INFO,
    titulo: 'Actualización de pedido',
    mensaje: `El pedido PED-${String(plain.id).padStart(5, '0')} cambió de estado.`,
  };

  return notification({
    id: `pedido:${plain.id}:${plain.estado}`,
    tipo: DASHBOARD_NOTIFICATION_TYPES.PEDIDO_ESTADO,
    nivel: definition.nivel,
    titulo: definition.titulo,
    mensaje: definition.mensaje,
    entidadId: plain.id,
    accesoId: DASHBOARD_ACCESS.PEDIDOS,
    creadaEn: plain.updated_at ?? plain.created_at,
  });
};

const mapReadyOrderNotification = (order) => {
  const plain = toPlain(order);

  return notification({
    id: `pedido-listo:${plain.id}`,
    tipo: DASHBOARD_NOTIFICATION_TYPES.PEDIDO_LISTO,
    nivel: DASHBOARD_LEVELS.SUCCESS,
    titulo: 'Pedido listo para planificar',
    mensaje: `PED-${String(plain.id).padStart(5, '0')} está disponible para una jornada.`,
    entidadId: plain.id,
    accesoId: DASHBOARD_ACCESS.JORNADAS,
    creadaEn:
      plain.preparacion_finalizada_en ??
      plain.updated_at,
  });
};

const mapPreparationNotification = (order) => {
  const plain = toPlain(order);

  return notification({
    id: `preparacion:${plain.id}`,
    tipo: DASHBOARD_NOTIFICATION_TYPES.PEDIDO_PREPARACION,
    nivel: DASHBOARD_LEVELS.WARNING,
    titulo: 'Pedido pendiente de preparación',
    mensaje: `PED-${String(plain.id).padStart(5, '0')} requiere completar sus productos.`,
    entidadId: plain.id,
    accesoId: DASHBOARD_ACCESS.PREPARACION,
    creadaEn:
      plain.enviado_preparacion_en ??
      plain.updated_at,
  });
};

const mapLoadNotification = (journey) => {
  const plain = toPlain(journey);
  const confirmed = Boolean(
    plain.carga_confirmada_en,
  );

  return notification({
    id: `carga:${plain.id}:${confirmed}`,
    tipo: confirmed
      ? DASHBOARD_NOTIFICATION_TYPES.CARGA_CONFIRMADA
      : DASHBOARD_NOTIFICATION_TYPES.CARGA_PENDIENTE,
    nivel: confirmed
      ? DASHBOARD_LEVELS.SUCCESS
      : DASHBOARD_LEVELS.WARNING,
    titulo: confirmed
      ? 'Carga confirmada'
      : 'Carga pendiente',
    mensaje: confirmed
      ? `La jornada JR-${String(plain.id).padStart(5, '0')} está lista para iniciar.`
      : `La jornada JR-${String(plain.id).padStart(5, '0')} necesita completar la carga.`,
    entidadId: plain.id,
    accesoId: DASHBOARD_ACCESS.CARGA,
    creadaEn:
      plain.carga_confirmada_en ??
      plain.updated_at,
  });
};

const mapNoDeliveryNotification = (dispatch) => {
  const plain = toPlain(dispatch);

  return notification({
    id: `no-entregado:${plain.id}`,
    tipo:
      DASHBOARD_NOTIFICATION_TYPES.DESPACHO_NO_ENTREGADO,
    nivel: DASHBOARD_LEVELS.DANGER,
    titulo: 'Despacho no entregado',
    mensaje: `El despacho DES-${String(plain.id).padStart(5, '0')} requiere seguimiento.`,
    entidadId: plain.id,
    accesoId: DASHBOARD_ACCESS.DESPACHOS,
    creadaEn: plain.updated_at,
  });
};

const mapJourneyWithoutDriverNotification = (
  journey,
) => {
  const plain = toPlain(journey);

  return notification({
    id: `jornada-sin-chofer:${plain.id}`,
    tipo:
      DASHBOARD_NOTIFICATION_TYPES.JORNADA_SIN_CHOFER,
    nivel: DASHBOARD_LEVELS.WARNING,
    titulo: 'Jornada sin chofer',
    mensaje: `La jornada JR-${String(plain.id).padStart(5, '0')} todavía no tiene conductor.`,
    entidadId: plain.id,
    accesoId: DASHBOARD_ACCESS.JORNADAS,
    creadaEn: plain.updated_at ?? plain.created_at,
  });
};

const mapLowStockNotification = (product) => {
  const plain = toPlain(product);

  return notification({
    id: `stock-bajo:${plain.id}`,
    tipo: DASHBOARD_NOTIFICATION_TYPES.STOCK_BAJO,
    nivel: DASHBOARD_LEVELS.WARNING,
    titulo: 'Stock bajo',
    mensaje: `${plain.nombre} tiene ${Number(plain.stock_actual)} unidades; mínimo ${Number(plain.stock_minimo)}.`,
    entidadId: plain.id,
    accesoId: DASHBOARD_ACCESS.PRODUCTOS,
    creadaEn: plain.updated_at,
  });
};

const mapPurchaseOrderNotification = (order) => {
  const plain = toPlain(order);

  return notification({
    id: `orden-compra:${plain.id}`,
    tipo:
      DASHBOARD_NOTIFICATION_TYPES.ORDEN_COMPRA_PENDIENTE,
    nivel: DASHBOARD_LEVELS.INFO,
    titulo: 'Orden de compra pendiente',
    mensaje: `La orden OC-${String(plain.id).padStart(5, '0')} está pendiente de aprobación.`,
    entidadId: plain.id,
    accesoId: DASHBOARD_ACCESS.PRODUCTOS,
    creadaEn: plain.updated_at ?? plain.created_at,
  });
};

const findLowStockProducts = (limit) =>
  Producto.findAll({
    where: {
      estado: true,
      [Op.and]: [lowStockCondition],
    },
    attributes: [
      'id',
      'nombre',
      'stock_actual',
      'stock_minimo',
      'updated_at',
    ],
    order: [
      ['stock_actual', 'ASC'],
      ['id', 'ASC'],
    ],
    limit,
  });

export const buildSalesNotifications = async (
  user,
  limit,
) => {
  const orders = await Pedido.findAll({
    where: {
      creado_por_usuario_id: user.id,
      estado: {
        [Op.in]: [
          'PREPARANDO',
          'LISTO_PARA_DESPACHO',
          'DESPACHADO',
          'ENTREGADO',
          'REPROGRAMADO',
        ],
      },
    },
    attributes: [
      'id',
      'estado',
      'created_at',
      'updated_at',
    ],
    order: [['updated_at', 'DESC']],
    limit,
  });

  return orders.map(mapSalesOrderNotification);
};

export const buildWarehouseNotifications = async (
  limit,
) => {
  const [orders, journeys] = await Promise.all([
    Pedido.findAll({
      where: { estado: 'PREPARANDO' },
      attributes: [
        'id',
        'enviado_preparacion_en',
        'updated_at',
      ],
      order: [['updated_at', 'DESC']],
      limit,
    }),
    JornadaReparto.findAll({
      where: { estado: 'PLANIFICADA' },
      attributes: [
        'id',
        'carga_confirmada_en',
        'created_at',
        'updated_at',
      ],
      order: [['updated_at', 'DESC']],
      limit,
    }),
  ]);

  return sortNotifications(
    [
      ...orders.map(mapPreparationNotification),
      ...journeys.map(mapLoadNotification),
    ],
    limit,
  );
};

export const buildLogisticsNotifications = async (
  limit,
) => {
  const [orders, dispatches, journeys] =
    await Promise.all([
      Pedido.findAll({
        where: {
          estado: 'LISTO_PARA_DESPACHO',
        },
        attributes: [
          'id',
          'preparacion_finalizada_en',
          'updated_at',
        ],
        order: [['updated_at', 'DESC']],
        limit,
      }),
      Despacho.findAll({
        where: { estado: 'NO_ENTREGADO' },
        attributes: [
          'id',
          'updated_at',
        ],
        order: [['updated_at', 'DESC']],
        limit,
      }),
      JornadaReparto.findAll({
        where: {
          estado: 'PLANIFICADA',
          chofer_id: {
            [Op.is]: null,
          },
        },
        attributes: [
          'id',
          'created_at',
          'updated_at',
        ],
        order: [['updated_at', 'DESC']],
        limit,
      }),
    ]);

  return sortNotifications(
    [
      ...orders.map(mapReadyOrderNotification),
      ...dispatches.map(mapNoDeliveryNotification),
      ...journeys.map(
        mapJourneyWithoutDriverNotification,
      ),
    ],
    limit,
  );
};

export const buildDriverNotifications = async (
  user,
  limit,
) => {
  const chofer = await Chofer.findOne({
    where: {
      usuario_id: user.id,
      activo: true,
    },
    attributes: ['id'],
  });

  if (!chofer) {
    return [];
  }

  const plainChofer = toPlain(chofer);

  const operationalDate = getOperationalDate();

  const journey = await JornadaReparto.findOne({
    where: {
      chofer_id: plainChofer.id,
      [Op.or]: [
        {
          estado: 'EN_RUTA',
        },
        {
          estado: 'PLANIFICADA',
          fecha: {
            [Op.gte]: operationalDate,
          },
        },
      ],
    },
    attributes: [
      'id',
      'estado',
      'fecha',
      'posicion_actual_orden',
      'carga_confirmada_en',
      'inicio_estimado_en',
      'updated_at',
    ],
    include: [
      {
        model: Camion,
        as: 'camion',
        attributes: [
          'id',
          'codigo',
          'placa',
        ],
      },
      {
        model: Despacho,
        as: 'despachos',
        required: false,
        attributes: [
          'id',
          'orden_entrega',
          'estado',
          'fecha_estimada_entrega',
        ],
      },
    ],
    order: [
      ['estado', 'ASC'],
      ['fecha', 'ASC'],
      [
        { model: Despacho, as: 'despachos' },
        'orden_entrega',
        'ASC',
      ],
    ],
  });

  const plainJourney = toPlain(journey);

  if (!plainJourney) {
    return [];
  }

  const items = [
    notification({
      id: `jornada-asignada:${plainJourney.id}`,
      tipo:
        DASHBOARD_NOTIFICATION_TYPES.JORNADA_ASIGNADA,
      nivel: DASHBOARD_LEVELS.INFO,
      titulo: 'Jornada asignada',
      mensaje: `JR-${String(plainJourney.id).padStart(5, '0')} está asignada al camión ${plainJourney.camion?.codigo ?? plainJourney.camion?.placa ?? 'indicado'}.`,
      entidadId: plainJourney.id,
      accesoId: DASHBOARD_ACCESS.MI_JORNADA,
      creadaEn:
        plainJourney.inicio_estimado_en ??
        plainJourney.updated_at,
    }),
  ];

  if (plainJourney.carga_confirmada_en) {
    items.push(
      notification({
        id: `carga-confirmada:${plainJourney.id}`,
        tipo:
          DASHBOARD_NOTIFICATION_TYPES.CARGA_CONFIRMADA,
        nivel: DASHBOARD_LEVELS.SUCCESS,
        titulo: 'Camión listo',
        mensaje: 'Bodega confirmó la carga de su jornada.',
        entidadId: plainJourney.id,
        accesoId: DASHBOARD_ACCESS.MI_JORNADA,
        creadaEn: plainJourney.carga_confirmada_en,
      }),
    );
  } else {
    items.push(
      notification({
        id: `carga-pendiente:${plainJourney.id}`,
        tipo:
          DASHBOARD_NOTIFICATION_TYPES.CARGA_PENDIENTE,
        nivel: DASHBOARD_LEVELS.WARNING,
        titulo: 'Carga pendiente',
        mensaje: 'La jornada aún no puede iniciar hasta confirmar la carga.',
        entidadId: plainJourney.id,
        accesoId: DASHBOARD_ACCESS.MI_JORNADA,
        creadaEn: plainJourney.updated_at,
      }),
    );
  }

  const nextDispatch = (
    plainJourney.despachos ?? []
  )
    .filter((dispatch) =>
      ['PENDIENTE', 'EN_TRANSITO'].includes(
        dispatch.estado,
      )
    )
    .sort(
      (left, right) =>
        Number(left.orden_entrega) -
        Number(right.orden_entrega),
    )[0];

  if (nextDispatch) {
    items.push(
      notification({
        id: `proxima-entrega:${nextDispatch.id}`,
        tipo:
          DASHBOARD_NOTIFICATION_TYPES.PEDIDO_ESTADO,
        nivel: DASHBOARD_LEVELS.INFO,
        titulo: 'Próxima entrega',
        mensaje: `La parada ${nextDispatch.orden_entrega} es la siguiente entrega pendiente.`,
        entidadId: nextDispatch.id,
        accesoId: DASHBOARD_ACCESS.MI_JORNADA,
        creadaEn:
          nextDispatch.fecha_estimada_entrega ??
          plainJourney.updated_at,
      }),
    );
  }

  return sortNotifications(items, limit);
};

export const buildPurchasingNotifications = async (
  limit,
) => {
  const [products, orders] = await Promise.all([
    findLowStockProducts(limit),
    OrdenCompra.findAll({
      where: { estado: 'PENDIENTE' },
      attributes: [
        'id',
        'created_at',
        'updated_at',
      ],
      order: [['updated_at', 'DESC']],
      limit,
    }),
  ]);

  return sortNotifications(
    [
      ...products.map(mapLowStockNotification),
      ...orders.map(mapPurchaseOrderNotification),
    ],
    limit,
  );
};

export const buildAdminNotifications = async (
  limit,
) => {
  const partialLimit = Math.max(
    2,
    Math.ceil(limit / 3),
  );

  const [
    logistics,
    warehouse,
    purchasing,
  ] = await Promise.all([
    buildLogisticsNotifications(partialLimit),
    buildWarehouseNotifications(partialLimit),
    buildPurchasingNotifications(partialLimit),
  ]);

  return sortNotifications(
    [
      ...logistics,
      ...warehouse,
      ...purchasing,
    ],
    limit,
  );
};
