import {
  matchPath,
} from 'react-router-dom';

import {
  AccessDeniedPage,
  CentroLogisticoPage,
  ClientesPage,
  DashboardPage,
  DespachosPage,
  JornadaDetallePage,
  NotFoundPage,
  NuevoPedidoPage,
  PedidoWorkspacePage,
  PedidosPage,
  RutasPage,
  UbicacionesPage,
} from './routeComponents';

import {
  PERMISSIONS,
  ROLES,
} from '../constants/permissions';

export const routeRegistry = [
  {
    id: 'dashboard',
    path: '/',
    label: 'Dashboard',
    description: 'Resumen operativo según tu rol y permisos vigentes.',
    icon: 'bi-grid-1x2-fill',
    element: <DashboardPage />,
  },
  {
    id: 'clientes',
    path: '/clientes',
    label: 'Clientes',
    description: 'Consulta y gestión del directorio comercial.',
    icon: 'bi-people',
    access: {
      permission: PERMISSIONS.CLIENTES_LEER,
      roles: [
        ROLES.ADMIN,
        ROLES.VENTAS,
        ROLES.LOGISTICA,
      ],
    },
    element: <ClientesPage />,
  },
  {
    id: 'pedidos',
    path: '/pedidos',
    label: 'Pedidos',
    description: 'Gestión y seguimiento del flujo de pedidos.',
    icon: 'bi-receipt',
    access: {
      permission: PERMISSIONS.PEDIDOS_LEER,
      roles: [
        ROLES.ADMIN,
        ROLES.VENTAS,
        ROLES.LOGISTICA,
      ],
    },
    element: <PedidosPage />,
  },
  {
    id: 'ubicaciones',
    path: '/ubicaciones',
    label: 'Ubicaciones',
    description: 'Puntos geográficos utilizados por la operación.',
    icon: 'bi-geo-alt',
    access: {
      permission: PERMISSIONS.UBICACIONES_LEER,
      roles: [
        ROLES.ADMIN,
        ROLES.VENTAS,
        ROLES.LOGISTICA,
      ],
    },
    element: <UbicacionesPage />,
  },
  {
    id: 'rutas',
    path: '/rutas',
    label: 'Rutas',
    description: 'Configuración y supervisión de la red logística.',
    icon: 'bi-signpost-split',
    access: {
      permission: PERMISSIONS.RUTAS_LEER,
      roles: [
        ROLES.ADMIN,
        ROLES.LOGISTICA,
      ],
    },
    element: <RutasPage />,
  },
  {
    id: 'centro-logistico',
    path: '/centro-logistico',
    label: 'Centro Logístico',
    description: 'Planificación de jornadas y asignación logística.',
    icon: 'bi-box-seam',
    access: {
      anyPermissions: [
        PERMISSIONS.JORNADAS_MAPA_GENERAL,
        PERMISSIONS.JORNADAS_GENERAR,
      ],
      roles: [
        ROLES.ADMIN,
        ROLES.LOGISTICA,
      ],
    },
    element: <CentroLogisticoPage />,
  },
  {
    id: 'despachos',
    path: '/despachos',
    label: 'Despachos',
    description: 'Seguimiento operativo de entregas y novedades.',
    icon: 'bi-truck',
    access: {
      permission: PERMISSIONS.DESPACHOS_LEER,
      roles: [
        ROLES.ADMIN,
        ROLES.LOGISTICA,
      ],
    },
    element: <DespachosPage />,
  },
  {
    id: 'mis-entregas',
    path: '/mis-entregas',
    label: 'Mis entregas',
    description: 'Despachos y entregas asignados al chofer autenticado.',
    icon: 'bi-geo-alt-fill',
    access: {
      permission: PERMISSIONS.DESPACHOS_LEER,
      roles: [ROLES.CHOFER],
    },
    element: <DespachosPage />,
  },
  {
    id: 'pedido-nuevo',
    path: '/pedidos/nuevo',
    label: 'Nuevo pedido',
    description: 'Registro inicial antes de agregar productos.',
    icon: 'bi-plus-circle',
    access: {
      permission: PERMISSIONS.PEDIDOS_CREAR,
    },
    element: <NuevoPedidoPage />,
    hidden: true,
  },
  {
    id: 'pedido-workspace',
    path: '/pedidos/:id/workspace',
    label: 'Workspace del pedido',
    description: 'Gestión comercial de productos y envío a preparación.',
    icon: 'bi-layout-text-window-reverse',
    access: {
      anyPermissions: [
        PERMISSIONS.PEDIDOS_EDITAR,
        PERMISSIONS.PEDIDOS_ENVIAR_PREPARACION,
      ],
      roles: [
        ROLES.ADMIN,
        ROLES.VENTAS,
      ],
    },
    element: <PedidoWorkspacePage />,
    hidden: true,
  },
  {
    id: 'jornada-detalle',
    path: '/centro-logistico/jornadas/:id',
    label: 'Detalle de jornada',
    description: 'Seguimiento de ruta, entregas y estado de la jornada.',
    icon: 'bi-calendar2-event-fill',
    access: {
      permission: PERMISSIONS.JORNADAS_LEER,
    },
    element: <JornadaDetallePage />,
    hidden: true,
  },
  {
    id: 'access-denied',
    path: '/acceso-denegado',
    label: 'Acceso denegado',
    description: 'La sesión no posee el permiso requerido.',
    icon: 'bi-shield-lock',
    element: <AccessDeniedPage />,
    hidden: true,
  },
  {
    id: 'not-found',
    path: '*',
    label: 'Página no encontrada',
    description: 'La ruta solicitada no existe.',
    icon: 'bi-signpost-split',
    element: <NotFoundPage />,
    hidden: true,
  },
];

export function getRouteById(id) {
  return routeRegistry.find(
    (route) => route.id === id,
  ) ?? null;
}

export function getRouteByPathname(pathname) {
  return (
    routeRegistry.find((route) => {
      if (route.path === '*') {
        return false;
      }

      return Boolean(
        matchPath(
          {
            path: route.path,
            end: true,
          },
          pathname,
        ),
      );
    }) ?? getRouteById('not-found')
  );
}
