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
    routeId: 'jornadas',
    icon: 'bi-calendar2-week',
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
    routeId: 'camiones',
    icon: 'bi-truck-front',
  },
  CHOFERES: {
    routeId: 'choferes',
    icon: 'bi-person-vcard',
  },
  MI_JORNADA: {
    routeId: 'mi-jornada',
    icon: 'bi-geo-alt-fill',
  },
  PRODUCTOS: {
    routeId: 'help',
    icon: 'bi-boxes',
    informational: true,
  },
  CATEGORIAS: {
    routeId: 'help',
    icon: 'bi-tags',
    informational: true,
  },
  USUARIOS: {
    routeId: 'help',
    icon: 'bi-person-gear',
    informational: true,
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
  jornada_actual: 'Jornada actual',
  camion: 'Camión asignado',
  chofer: 'Chofer',
  perfil_chofer: 'Perfil de chofer',
  proxima_parada: 'Próxima parada',
  modulo: 'Dominio funcional',
});

const CONTEXT_ICONS = Object.freeze({
  alcance_pedidos: 'bi-funnel',
  clientes_activos: 'bi-people',
  usuarios_activos: 'bi-person-check',
  fecha_operativa: 'bi-calendar3',
  jornada_id: 'bi-calendar2-week',
  jornada_actual: 'bi-geo-alt-fill',
  camion: 'bi-truck-front',
  chofer: 'bi-person-vcard',
  perfil_chofer: 'bi-person-badge',
  proxima_parada: 'bi-signpost',
  modulo: 'bi-diagram-3',
});

export function normalizeDashboardVariant(level) {
  return LEVEL_VARIANTS[level] ?? 'primary';
}

export function getDashboardMetricIcon(metricId) {
  const normalized = String(metricId ?? '');

  return METRIC_ICON_RULES.find(([pattern]) =>
    pattern.test(normalized))?.[1] ?? 'bi-bar-chart';
}

export function getDashboardAccessConfig(accessId, role) {
  if (accessId === 'DESPACHOS' && role === ROLES.CHOFER) {
    return {
      routeId: 'mi-jornada',
      icon: 'bi-geo-alt-fill',
    };
  }

  return ACCESS_CONFIG[accessId] ?? null;
}

export function getDashboardNotificationPath(notification, role) {
  const accessId = notification?.acceso_id;
  const entityId = notification?.entidad_id;

  if (accessId === 'CARGA' && entityId) {
    return `/bodega/cargas/${entityId}`;
  }

  if (accessId === 'PREPARACION' && entityId) {
    return `/bodega/preparacion/${entityId}`;
  }

  if (accessId === 'JORNADAS' && entityId) {
    return `/jornadas/${entityId}`;
  }

  if (accessId === 'MI_JORNADA' || role === ROLES.CHOFER) {
    return '/mi-jornada';
  }

  const config = getDashboardAccessConfig(accessId, role);

  const routePaths = {
    dashboard: '/',
    help: '/ayuda?tab=rol',
    clientes: '/clientes',
    pedidos: '/pedidos',
    'bodega-preparacion': '/bodega/preparacion',
    'bodega-cargas': '/bodega/cargas',
    ubicaciones: '/ubicaciones',
    jornadas: '/jornadas',
    despachos: '/despachos',
    camiones: '/camiones',
    choferes: '/choferes',
    rutas: '/rutas',
    'mi-jornada': '/mi-jornada',
  };

  return routePaths[config?.routeId] ?? '/';
}

export function normalizeDashboardNotification(item, role) {
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

export function getDashboardContextIcon(key) {
  return CONTEXT_ICONS[key] ?? 'bi-info-circle';
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

    if (value.placa) return value.placa;
    if (value.nombre) return value.nombre;

    return 'Información disponible';
  }

  if (value === 'INBOUND_PROVISIONAL') {
    return 'Inbound informativo';
  }

  return String(value);
}
