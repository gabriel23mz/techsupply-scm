import {
  Op,
  col,
  where as sequelizeWhere,
} from 'sequelize';

import db from '../../models/index.js';

import {
  DASHBOARD_ACCESS,
  DASHBOARD_LEVELS,
} from '../../constants/dashboard.js';

import {
  getOperationalDate,
} from '../../utils/logisticTime.js';

import * as choferService
  from '../chofer.service.js';

import {
  access,
  metric,
  toPlain,
} from './dashboard.shared.js';

const {
  Usuario,
  Categoria,
  Producto,
  Cliente,
  Pedido,
  Despacho,
  Camion,
  JornadaReparto,
  Chofer,
  OrdenCompra,
} = db;

const activeOrderStates = [
  'PENDIENTE',
  'PREPARANDO',
  'LISTO_PARA_DESPACHO',
  'DESPACHADO',
  'REPROGRAMADO',
];

const lowStockCondition = sequelizeWhere(
  col('stock_actual'),
  Op.lte,
  col('stock_minimo'),
);

const countLowStock = () => Producto.count({
  where: {
    estado: true,
    [Op.and]: [lowStockCondition],
  },
});

const buildAdminAccesses = () => [
  access({
    id: DASHBOARD_ACCESS.PEDIDOS,
    titulo: 'Pedidos',
    descripcion: 'Supervisar el ciclo comercial completo.',
  }),
  access({
    id: DASHBOARD_ACCESS.PREPARACION,
    titulo: 'Preparación',
    descripcion: 'Revisar pedidos en preparación de bodega.',
  }),
  access({
    id: DASHBOARD_ACCESS.CARGA,
    titulo: 'Carga',
    descripcion: 'Supervisar la carga de jornadas planificadas.',
  }),
  access({
    id: DASHBOARD_ACCESS.JORNADAS,
    titulo: 'Jornadas',
    descripcion: 'Administrar la planificación logística.',
  }),
  access({
    id: DASHBOARD_ACCESS.CLIENTES,
    titulo: 'Clientes',
    descripcion: 'Gestionar la cartera de clientes.',
  }),
  access({
    id: DASHBOARD_ACCESS.PRODUCTOS,
    titulo: 'Productos',
    descripcion: 'Consultar y mantener el catálogo.',
  }),
  access({
    id: DASHBOARD_ACCESS.USUARIOS,
    titulo: 'Usuarios',
    descripcion: 'Administrar accesos y roles.',
  }),
];

const buildSalesAccesses = () => [
  access({
    id: DASHBOARD_ACCESS.PEDIDOS,
    titulo: 'Pedidos',
    descripcion: 'Crear y gestionar sus pedidos.',
  }),
  access({
    id: DASHBOARD_ACCESS.CLIENTES,
    titulo: 'Clientes',
    descripcion: 'Gestionar clientes comerciales.',
  }),
  access({
    id: DASHBOARD_ACCESS.UBICACIONES,
    titulo: 'Ubicaciones',
    descripcion: 'Consultar destinos disponibles.',
  }),
];

const buildWarehouseAccesses = () => [
  access({
    id: DASHBOARD_ACCESS.PREPARACION,
    titulo: 'Preparación de pedidos',
    descripcion: 'Completar productos y cerrar cajas.',
  }),
  access({
    id: DASHBOARD_ACCESS.CARGA,
    titulo: 'Carga de camiones',
    descripcion: 'Registrar y confirmar la carga.',
  }),
];

const buildLogisticsAccesses = () => [
  access({
    id: DASHBOARD_ACCESS.JORNADAS,
    titulo: 'Jornadas',
    descripcion: 'Planificar y supervisar rutas.',
  }),
  access({
    id: DASHBOARD_ACCESS.DESPACHOS,
    titulo: 'Despachos',
    descripcion: 'Consultar entregas y novedades.',
  }),
  access({
    id: DASHBOARD_ACCESS.CAMIONES,
    titulo: 'Camiones',
    descripcion: 'Administrar la flota disponible.',
  }),
  access({
    id: DASHBOARD_ACCESS.CHOFERES,
    titulo: 'Choferes',
    descripcion: 'Consultar y asignar conductores.',
  }),
  access({
    id: DASHBOARD_ACCESS.RUTAS,
    titulo: 'Rutas',
    descripcion: 'Mantener la red logística.',
  }),
  access({
    id: DASHBOARD_ACCESS.UBICACIONES,
    titulo: 'Ubicaciones',
    descripcion: 'Gestionar los puntos geográficos.',
  }),
  access({
    id: DASHBOARD_ACCESS.CLIENTES,
    titulo: 'Clientes',
    descripcion: 'Consultar destinos de entrega.',
  }),
];

const buildPurchasingAccesses = () => [
  access({
    id: DASHBOARD_ACCESS.PRODUCTOS,
    titulo: 'Productos',
    descripcion: 'Consultar stock y catálogo.',
  }),
  access({
    id: DASHBOARD_ACCESS.CATEGORIAS,
    titulo: 'Categorías',
    descripcion: 'Organizar el catálogo de productos.',
  }),
];

export const buildAdminSummary = async () => {
  const [
    usuariosActivos,
    clientesActivos,
    pedidosActivos,
    pedidosPreparando,
    pedidosListos,
    jornadasPlanificadas,
    jornadasEnRuta,
    despachosNoEntregados,
    camionesEnBodega,
    stockBajo,
  ] = await Promise.all([
    Usuario.count({ where: { estado: true } }),
    Cliente.count({ where: { estado: true } }),
    Pedido.count({
      where: {
        estado: {
          [Op.in]: activeOrderStates,
        },
      },
    }),
    Pedido.count({ where: { estado: 'PREPARANDO' } }),
    Pedido.count({
      where: { estado: 'LISTO_PARA_DESPACHO' },
    }),
    JornadaReparto.count({
      where: { estado: 'PLANIFICADA' },
    }),
    JornadaReparto.count({
      where: { estado: 'EN_RUTA' },
    }),
    Despacho.count({
      where: { estado: 'NO_ENTREGADO' },
    }),
    Camion.count({
      where: { estado: 'EN_BODEGA' },
    }),
    countLowStock(),
  ]);

  return {
    metricas: [
      metric({
        id: 'pedidos_activos',
        titulo: 'Pedidos activos',
        valor: pedidosActivos,
        descripcion: 'Pedidos todavía dentro del ciclo operativo.',
      }),
      metric({
        id: 'pedidos_preparando',
        titulo: 'En preparación',
        valor: pedidosPreparando,
        descripcion: 'Pedidos actualmente atendidos por bodega.',
        nivel: DASHBOARD_LEVELS.WARNING,
      }),
      metric({
        id: 'pedidos_listos',
        titulo: 'Listos para despacho',
        valor: pedidosListos,
        descripcion: 'Pedidos disponibles para planificación.',
        nivel: DASHBOARD_LEVELS.SUCCESS,
      }),
      metric({
        id: 'jornadas_planificadas',
        titulo: 'Jornadas planificadas',
        valor: jornadasPlanificadas,
        descripcion: 'Jornadas pendientes de salida.',
      }),
      metric({
        id: 'jornadas_en_ruta',
        titulo: 'Jornadas en ruta',
        valor: jornadasEnRuta,
        descripcion: 'Operaciones de entrega en ejecución.',
        nivel: DASHBOARD_LEVELS.SUCCESS,
      }),
      metric({
        id: 'despachos_no_entregados',
        titulo: 'No entregados',
        valor: despachosNoEntregados,
        descripcion: 'Despachos que requieren seguimiento.',
        nivel: despachosNoEntregados > 0
          ? DASHBOARD_LEVELS.DANGER
          : DASHBOARD_LEVELS.INFO,
      }),
      metric({
        id: 'camiones_en_bodega',
        titulo: 'Camiones en bodega',
        valor: camionesEnBodega,
        descripcion: 'Unidades disponibles en la base.',
      }),
      metric({
        id: 'stock_bajo',
        titulo: 'Productos con stock bajo',
        valor: stockBajo,
        descripcion: 'Productos iguales o inferiores al mínimo.',
        nivel: stockBajo > 0
          ? DASHBOARD_LEVELS.WARNING
          : DASHBOARD_LEVELS.SUCCESS,
      }),
    ],
    accesos: buildAdminAccesses(),
    contexto: {
      usuarios_activos: usuariosActivos,
      clientes_activos: clientesActivos,
    },
  };
};

export const buildSalesSummary = async (user) => {
  const ownOrderWhere = {
    creado_por_usuario_id: user.id,
  };

  const [
    pendientes,
    preparando,
    listos,
    entregados,
    reprogramados,
    clientesActivos,
  ] = await Promise.all([
    Pedido.count({
      where: {
        ...ownOrderWhere,
        estado: 'PENDIENTE',
      },
    }),
    Pedido.count({
      where: {
        ...ownOrderWhere,
        estado: 'PREPARANDO',
      },
    }),
    Pedido.count({
      where: {
        ...ownOrderWhere,
        estado: 'LISTO_PARA_DESPACHO',
      },
    }),
    Pedido.count({
      where: {
        ...ownOrderWhere,
        estado: 'ENTREGADO',
      },
    }),
    Pedido.count({
      where: {
        ...ownOrderWhere,
        estado: 'REPROGRAMADO',
      },
    }),
    Cliente.count({ where: { estado: true } }),
  ]);

  return {
    metricas: [
      metric({
        id: 'pedidos_pendientes',
        titulo: 'Pendientes',
        valor: pendientes,
        descripcion: 'Pedidos propios todavía editables.',
      }),
      metric({
        id: 'pedidos_preparando',
        titulo: 'En preparación',
        valor: preparando,
        descripcion: 'Pedidos propios enviados a bodega.',
        nivel: DASHBOARD_LEVELS.WARNING,
      }),
      metric({
        id: 'pedidos_listos',
        titulo: 'Listos para despacho',
        valor: listos,
        descripcion: 'Pedidos propios preparados completamente.',
        nivel: DASHBOARD_LEVELS.SUCCESS,
      }),
      metric({
        id: 'pedidos_entregados',
        titulo: 'Entregados',
        valor: entregados,
        descripcion: 'Pedidos propios entregados al cliente.',
        nivel: DASHBOARD_LEVELS.SUCCESS,
      }),
      metric({
        id: 'pedidos_reprogramados',
        titulo: 'Reprogramados',
        valor: reprogramados,
        descripcion: 'Pedidos propios pendientes de nueva entrega.',
        nivel: reprogramados > 0
          ? DASHBOARD_LEVELS.WARNING
          : DASHBOARD_LEVELS.INFO,
      }),
    ],
    accesos: buildSalesAccesses(),
    contexto: {
      alcance_pedidos: 'PROPIOS',
      clientes_activos: clientesActivos,
    },
  };
};

export const buildWarehouseSummary = async () => {
  const [
    pedidosPreparando,
    jornadasPendientesCarga,
    cargasConfirmadas,
    despachosPendientesCarga,
  ] = await Promise.all([
    Pedido.count({ where: { estado: 'PREPARANDO' } }),
    JornadaReparto.count({
      where: {
        estado: 'PLANIFICADA',
        carga_confirmada_en: {
          [Op.is]: null,
        },
      },
    }),
    JornadaReparto.count({
      where: {
        estado: 'PLANIFICADA',
        carga_confirmada_en: {
          [Op.ne]: null,
        },
      },
    }),
    Despacho.count({
      where: {
        estado: 'PENDIENTE',
        cargado: false,
        jornada_reparto_id: {
          [Op.ne]: null,
        },
      },
    }),
  ]);

  return {
    metricas: [
      metric({
        id: 'pedidos_preparando',
        titulo: 'Pedidos por preparar',
        valor: pedidosPreparando,
        descripcion: 'Pedidos que requieren completar productos.',
        nivel: pedidosPreparando > 0
          ? DASHBOARD_LEVELS.WARNING
          : DASHBOARD_LEVELS.SUCCESS,
      }),
      metric({
        id: 'jornadas_pendientes_carga',
        titulo: 'Camiones por cargar',
        valor: jornadasPendientesCarga,
        descripcion: 'Jornadas planificadas sin carga confirmada.',
        nivel: jornadasPendientesCarga > 0
          ? DASHBOARD_LEVELS.WARNING
          : DASHBOARD_LEVELS.SUCCESS,
      }),
      metric({
        id: 'despachos_pendientes_carga',
        titulo: 'Cajas pendientes',
        valor: despachosPendientesCarga,
        descripcion: 'Despachos todavía no registrados en el camión.',
      }),
      metric({
        id: 'cargas_confirmadas',
        titulo: 'Cargas confirmadas',
        valor: cargasConfirmadas,
        descripcion: 'Jornadas listas para iniciar su recorrido.',
        nivel: DASHBOARD_LEVELS.SUCCESS,
      }),
    ],
    accesos: buildWarehouseAccesses(),
    contexto: {},
  };
};

export const buildLogisticsSummary = async (user) => {
  const operationalDate = getOperationalDate();

  const [
    pedidosListos,
    jornadasPlanificadas,
    jornadasEnRuta,
    camionesEnBodega,
    choferesDisponibles,
    noEntregados,
  ] = await Promise.all([
    Pedido.count({
      where: { estado: 'LISTO_PARA_DESPACHO' },
    }),
    JornadaReparto.count({
      where: { estado: 'PLANIFICADA' },
    }),
    JornadaReparto.count({
      where: { estado: 'EN_RUTA' },
    }),
    Camion.count({
      where: { estado: 'EN_BODEGA' },
    }),
    choferService.obtenerDisponibles(
      operationalDate,
      user,
    ),
    Despacho.count({
      where: { estado: 'NO_ENTREGADO' },
    }),
  ]);

  return {
    metricas: [
      metric({
        id: 'pedidos_listos',
        titulo: 'Pedidos listos',
        valor: pedidosListos,
        descripcion: 'Pedidos disponibles para generar jornadas.',
        nivel: pedidosListos > 0
          ? DASHBOARD_LEVELS.SUCCESS
          : DASHBOARD_LEVELS.INFO,
      }),
      metric({
        id: 'jornadas_planificadas',
        titulo: 'Planificadas',
        valor: jornadasPlanificadas,
        descripcion: 'Jornadas pendientes de salida.',
      }),
      metric({
        id: 'jornadas_en_ruta',
        titulo: 'En ruta',
        valor: jornadasEnRuta,
        descripcion: 'Jornadas operando actualmente.',
        nivel: DASHBOARD_LEVELS.SUCCESS,
      }),
      metric({
        id: 'camiones_disponibles',
        titulo: 'Camiones disponibles',
        valor: camionesEnBodega,
        descripcion: 'Camiones ubicados en bodega.',
      }),
      metric({
        id: 'choferes_disponibles',
        titulo: 'Choferes disponibles',
        valor: choferesDisponibles.length,
        descripcion: 'Choferes vigentes y sin jornada activa.',
      }),
      metric({
        id: 'despachos_no_entregados',
        titulo: 'No entregados',
        valor: noEntregados,
        descripcion: 'Novedades que requieren seguimiento.',
        nivel: noEntregados > 0
          ? DASHBOARD_LEVELS.DANGER
          : DASHBOARD_LEVELS.SUCCESS,
      }),
    ],
    accesos: buildLogisticsAccesses(),
    contexto: {
      fecha_operativa: operationalDate,
    },
  };
};

export const buildDriverSummary = async (user) => {
  const chofer = await Chofer.findOne({
    where: {
      usuario_id: user.id,
      activo: true,
    },
    attributes: [
      'id',
      'numero_licencia',
      'categoria_licencia',
      'fecha_vencimiento_licencia',
    ],
  });

  if (!chofer) {
    return {
      metricas: [
        metric({
          id: 'jornada_asignada',
          titulo: 'Jornada asignada',
          valor: 0,
          descripcion: 'No existe un perfil de chofer activo.',
          nivel: DASHBOARD_LEVELS.WARNING,
        }),
      ],
      accesos: [],
      contexto: {
        perfil_chofer: null,
        jornada_actual: null,
      },
    };
  }

  const plainChofer = toPlain(chofer);

  const operationalDate = getOperationalDate();

  const jornada = await JornadaReparto.findOne({
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
      'fecha',
      'estado',
      'posicion_actual_orden',
      'inicio_estimado_en',
      'retorno_estimado_en',
      'carga_confirmada_en',
    ],
    include: [
      {
        model: Camion,
        as: 'camion',
        attributes: [
          'id',
          'codigo',
          'placa',
          'descripcion',
          'estado',
        ],
      },
      {
        model: Despacho,
        as: 'despachos',
        attributes: [
          'id',
          'orden_entrega',
          'estado',
          'cargado',
          'fecha_estimada_entrega',
        ],
        required: false,
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

  const plainJourney = toPlain(jornada);
  const dispatches = plainJourney?.despachos ?? [];
  const pending = dispatches.filter((dispatch) =>
    ['PENDIENTE', 'EN_TRANSITO'].includes(
      dispatch.estado,
    )
  ).length;
  const delivered = dispatches.filter(
    (dispatch) => dispatch.estado === 'ENTREGADO',
  ).length;
  const notDelivered = dispatches.filter(
    (dispatch) => dispatch.estado === 'NO_ENTREGADO',
  ).length;

  return {
    metricas: [
      metric({
        id: 'jornada_asignada',
        titulo: 'Jornada asignada',
        valor: plainJourney ? 1 : 0,
        descripcion: plainJourney
          ? 'Tiene una jornada activa asignada.'
          : 'No tiene una jornada activa.',
        nivel: plainJourney
          ? DASHBOARD_LEVELS.SUCCESS
          : DASHBOARD_LEVELS.INFO,
      }),
      metric({
        id: 'entregas_pendientes',
        titulo: 'Entregas pendientes',
        valor: pending,
        descripcion: 'Paradas todavía abiertas en la jornada.',
      }),
      metric({
        id: 'entregas_completadas',
        titulo: 'Entregas completadas',
        valor: delivered,
        descripcion: 'Despachos entregados en la jornada actual.',
        nivel: DASHBOARD_LEVELS.SUCCESS,
      }),
      metric({
        id: 'entregas_no_realizadas',
        titulo: 'No entregadas',
        valor: notDelivered,
        descripcion: 'Despachos marcados con novedad.',
        nivel: notDelivered > 0
          ? DASHBOARD_LEVELS.WARNING
          : DASHBOARD_LEVELS.INFO,
      }),
    ],
    accesos: plainJourney
      ? [
        access({
          id: DASHBOARD_ACCESS.MI_JORNADA,
          titulo: 'Mi jornada',
          descripcion: 'Abrir mapa y gestionar entregas.',
        }),
      ]
      : [],
    contexto: {
      perfil_chofer: {
        id: plainChofer.id,
        numero_licencia:
          plainChofer.numero_licencia,
        categoria_licencia:
          plainChofer.categoria_licencia,
        fecha_vencimiento_licencia:
          plainChofer.fecha_vencimiento_licencia,
      },
      jornada_actual: plainJourney
        ? {
          id: plainJourney.id,
          codigo: `JR-${String(plainJourney.id).padStart(5, '0')}`,
          fecha: plainJourney.fecha,
          estado: plainJourney.estado,
          posicion_actual_orden:
            plainJourney.posicion_actual_orden,
          inicio_estimado_en:
            plainJourney.inicio_estimado_en,
          retorno_estimado_en:
            plainJourney.retorno_estimado_en,
          carga_confirmada: Boolean(
            plainJourney.carga_confirmada_en,
          ),
          camion: plainJourney.camion,
          resumen: {
            total_despachos: dispatches.length,
            pendientes: pending,
            entregados: delivered,
            no_entregados: notDelivered,
          },
        }
        : null,
    },
  };
};

export const buildPurchasingSummary = async () => {
  const [
    productosActivos,
    categoriasActivas,
    stockBajo,
    ordenesPendientes,
    ordenesAprobadas,
  ] = await Promise.all([
    Producto.count({ where: { estado: true } }),
    Categoria.count({ where: { estado: true } }),
    countLowStock(),
    OrdenCompra.count({
      where: { estado: 'PENDIENTE' },
    }),
    OrdenCompra.count({
      where: { estado: 'APROBADA' },
    }),
  ]);

  return {
    metricas: [
      metric({
        id: 'productos_activos',
        titulo: 'Productos activos',
        valor: productosActivos,
        descripcion: 'Productos disponibles en el catálogo.',
      }),
      metric({
        id: 'productos_stock_bajo',
        titulo: 'Stock bajo',
        valor: stockBajo,
        descripcion: 'Productos que requieren reposición.',
        nivel: stockBajo > 0
          ? DASHBOARD_LEVELS.WARNING
          : DASHBOARD_LEVELS.SUCCESS,
      }),
      metric({
        id: 'categorias_activas',
        titulo: 'Categorías',
        valor: categoriasActivas,
        descripcion: 'Categorías activas del catálogo.',
      }),
      metric({
        id: 'ordenes_pendientes',
        titulo: 'Órdenes pendientes',
        valor: ordenesPendientes,
        descripcion: 'Órdenes de compra aún no aprobadas.',
        nivel: ordenesPendientes > 0
          ? DASHBOARD_LEVELS.WARNING
          : DASHBOARD_LEVELS.INFO,
      }),
      metric({
        id: 'ordenes_aprobadas',
        titulo: 'Órdenes aprobadas',
        valor: ordenesAprobadas,
        descripcion: 'Órdenes pendientes de recepción.',
        nivel: DASHBOARD_LEVELS.SUCCESS,
      }),
    ],
    accesos: buildPurchasingAccesses(),
    contexto: {
      modulo: 'INBOUND_PROVISIONAL',
    },
  };
};
