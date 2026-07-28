import {
  ROLES,
} from '../constants/permissions';

const ACCESS_CONFIG = Object.freeze({
  CLIENTES: {
    routeId: 'clientes',
    icon: 'bi-people',
  },
  PEDIDOS: {
    routeId: 'pedidos',
    icon: 'bi-receipt',
  },
  PREPARACION: {
    routeId: 'bodega-preparacion',
    icon: 'bi-box-seam',
  },
  CARGA: {
    routeId: 'bodega-cargas',
    icon: 'bi-truck-flatbed',
  },
  UBICACIONES: {
    routeId: 'ubicaciones',
    icon: 'bi-geo-alt',
  },
  JORNADAS: {
    routeId: 'centro-logistico',
    icon: 'bi-calendar2-event',
  },
  DESPACHOS: {
    routeId: 'despachos',
    icon: 'bi-truck',
  },
  RUTAS: {
    routeId: 'rutas',
    icon: 'bi-signpost-split',
  },
  CAMIONES: {
    routeId: 'rutas',
    icon: 'bi-truck-front',
  },
  MI_JORNADA: {
    routeId: 'mis-entregas',
    icon: 'bi-geo-alt-fill',
  },
});

const METRIC_ICON_RULES = [
  [/pedido|orden/i, 'bi-receipt'],
  [/prepar|caja|carga/i, 'bi-box-seam'],
  [/jornada|ruta/i, 'bi-map'],
  [/despacho|entrega/i, 'bi-truck'],
  [/camion/i, 'bi-truck-front'],
  [/chofer/i, 'bi-person-badge'],
  [/stock|producto/i, 'bi-boxes'],
  [/cliente/i, 'bi-people'],
  [/usuario/i, 'bi-person-gear'],
  [/categoria/i, 'bi-tags'],
];

const LEVEL_VARIANTS = Object.freeze({
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
});

const LEVEL_ICONS = Object.freeze({
  INFO: 'bi-info-circle',
  SUCCESS: 'bi-check2-circle',
  WARNING: 'bi-exclamation-triangle',
  DANGER: 'bi-x-octagon',
});

const CONTEXT_LABELS = Object.freeze({
  alcance_pedidos: 'Alcance de pedidos',
  clientes_activos: 'Clientes activos',
  usuarios_activos: 'Usuarios activos',
  fecha_operativa: 'Fecha operativa',
  jornada_id: 'Jornada asignada',
  camion: 'Camión asignado',
  chofer: 'Chofer',
  proxima_parada: 'Próxima parada',
});

export function normalizeDashboardVariant(level) {
  return LEVEL_VARIANTS[level] ?? 'primary';
}

export function getDashboardMetricIcon(metricId) {
  const normalized = String(metricId ?? '');

  return (
    METRIC_ICON_RULES.find(([pattern]) =>
      pattern.test(normalized),
    )?.[1] ?? 'bi-bar-chart'
  );
}

export function getDashboardAccessConfig(
  accessId,
  role,
) {
  if (
    accessId === 'DESPACHOS' &&
    role === ROLES.CHOFER
  ) {
    return {
      routeId: 'mis-entregas',
      icon: 'bi-truck',
    };
  }

  return ACCESS_CONFIG[accessId] ?? null;
}

export function getDashboardNotificationPath(
  notification,
  role,
) {
  const accessId = notification?.acceso_id;
  const entityId = notification?.entidad_id;

  if (
    accessId === 'CARGA' &&
    entityId
  ) {
    return `/bodega/cargas/${entityId}`;
  }

  if (
    accessId === 'JORNADAS' &&
    entityId
  ) {
    return `/centro-logistico/jornadas/${entityId}`;
  }

  if (accessId === 'MI_JORNADA') {
    const journeyNotificationTypes = [
      'JORNADA_ASIGNADA',
      'CARGA_PENDIENTE',
      'CARGA_CONFIRMADA',
    ];

    if (
      entityId &&
      journeyNotificationTypes.includes(notification?.tipo)
    ) {
      return `/centro-logistico/jornadas/${entityId}`;
    }

    return '/mis-entregas';
  }

  const config = getDashboardAccessConfig(
    accessId,
    role,
  );

  const routePaths = {
    dashboard: '/',
    clientes: '/clientes',
    pedidos: '/pedidos',
    'bodega-preparacion': '/bodega/preparacion',
    'bodega-cargas': '/bodega/cargas',
    ubicaciones: '/ubicaciones',
    rutas: '/rutas',
    'centro-logistico': '/centro-logistico',
    despachos: '/despachos',
    'mis-entregas': '/mis-entregas',
  };

  return routePaths[config?.routeId] ?? '/';
}

export function normalizeDashboardNotification(
  item,
  role,
) {
  const level = item?.nivel ?? 'INFO';

  return {
    id: item?.id,
    title: item?.titulo ?? 'Notificación',
    message: item?.mensaje ?? '',
    variant: normalizeDashboardVariant(level),
    icon: LEVEL_ICONS[level] ?? 'bi-bell',
    path: getDashboardNotificationPath(item, role),
  };
}

export function getDashboardContextLabel(key) {
  return CONTEXT_LABELS[key] ?? String(key)
    .replaceAll('_', ' ')
    .replace(/^./, (value) => value.toUpperCase());
}

export function formatDashboardContextValue(value) {
  if (value === null || value === undefined || value === '') {
    return 'Sin información';
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }

  if (typeof value === 'object') {
    if (value.numero_licencia) {
      return [
        value.numero_licencia,
        value.categoria_licencia
          ? `Categoría ${value.categoria_licencia}`
          : null,
      ].filter(Boolean).join(' · ');
    }

    if (value.codigo) {
      return [
        value.codigo,
        value.estado,
        value.camion?.placa,
      ].filter(Boolean).join(' · ');
    }

    if (value.placa) {
      return value.placa;
    }

    if (value.nombre) {
      return value.nombre;
    }

    return 'Información disponible';
  }

  return String(value);
}
