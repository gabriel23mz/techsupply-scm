import {
  Navigate,
  matchPath,
} from 'react-router-dom';

import {
  AccessDeniedPage,
  BodegaCargasPage,
  BodegaCargaWorkspacePage,
  BodegaPreparacionPage,
  BodegaPreparacionWorkspacePage,
  CamionesPage,
  ChoferesPage,
  ClientesPage,
  DashboardPage,
  DespachosPage,
  HelpCenterPage,
  JornadaDetallePage,
  JornadasPage,
  MiJornadaPage,
  NotFoundPage,
  NuevoPedidoPage,
  PedidoWorkspacePage,
  PedidosPage,
  RutasPage,
  UbicacionesPage,
} from './routeComponents';

import LegacyJornadaRedirect from './LegacyJornadaRedirect';

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
    id: 'help',
    path: '/ayuda',
    label: 'Centro de ayuda',
    description: 'Información del sistema y orientación operativa para tu rol.',
    icon: 'bi-life-preserver',
    element: <HelpCenterPage />,
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
    id: 'bodega-preparacion',
    path: '/bodega/preparacion',
    label: 'Preparación',
    description: 'Control físico de productos antes de liberar pedidos.',
    icon: 'bi-box-seam',
    access: {
      permission: PERMISSIONS.PEDIDOS_PREPARAR,
      roles: [
        ROLES.ADMIN,
        ROLES.BODEGA,
      ],
    },
    element: <BodegaPreparacionPage />,
  },
  {
    id: 'bodega-preparacion-workspace',
    path: '/bodega/preparacion/:id',
    label: 'Preparar pedido',
    description: 'Actualización física de productos y cierre de preparación.',
    icon: 'bi-clipboard2-check',
    access: {
      permission: PERMISSIONS.PEDIDOS_PREPARAR,
      roles: [
        ROLES.ADMIN,
        ROLES.BODEGA,
      ],
    },
    element: <BodegaPreparacionWorkspacePage />,
    hidden: true,
  },
  {
    id: 'bodega-cargas',
    path: '/bodega/cargas',
    label: 'Carga',
    description: 'Control de despachos asignados a jornadas planificadas.',
    icon: 'bi-truck-flatbed',
    access: {
      permission: PERMISSIONS.CARGAS_LEER,
      roles: [
        ROLES.ADMIN,
        ROLES.BODEGA,
      ],
    },
    element: <BodegaCargasPage />,
  },
  {
    id: 'bodega-carga-workspace',
    path: '/bodega/cargas/:id',
    label: 'Cargar jornada',
    description: 'Verificación y confirmación de la carga del camión.',
    icon: 'bi-clipboard2-check',
    access: {
      permission: PERMISSIONS.CARGAS_LEER,
      roles: [
        ROLES.ADMIN,
        ROLES.BODEGA,
      ],
    },
    element: <BodegaCargaWorkspacePage />,
    hidden: true,
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
    id: 'jornadas',
    path: '/jornadas',
    label: 'Jornadas',
    description: 'Planificación, seguimiento y mapa operativo de reparto.',
    icon: 'bi-calendar2-week',
    access: {
      permission: PERMISSIONS.JORNADAS_LEER,
      roles: [
        ROLES.ADMIN,
        ROLES.LOGISTICA,
      ],
    },
    element: <JornadasPage />,
  },
  {
    id: 'camiones',
    path: '/camiones',
    label: 'Camiones',
    description: 'Gestión de la flota disponible para las jornadas.',
    icon: 'bi-truck-front',
    access: {
      permission: PERMISSIONS.CAMIONES_LEER,
      roles: [
        ROLES.ADMIN,
        ROLES.LOGISTICA,
      ],
    },
    element: <CamionesPage />,
  },
  {
    id: 'choferes',
    path: '/choferes',
    label: 'Choferes',
    description: 'Gestión de perfiles, licencias y disponibilidad operativa.',
    icon: 'bi-person-vcard',
    access: {
      permission: PERMISSIONS.CHOFERES_LEER,
      roles: [
        ROLES.ADMIN,
        ROLES.LOGISTICA,
      ],
    },
    element: <ChoferesPage />,
  },
  {
    id: 'rutas',
    path: '/rutas',
    label: 'Rutas',
    description: 'Configuración de conexiones viales entre ubicaciones logísticas.',
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
    id: 'mi-jornada',
    path: '/mi-jornada',
    label: 'Mi jornada',
    description: 'Recorrido, entregas y progreso de la jornada asignada.',
    icon: 'bi-geo-alt-fill',
    access: {
      permission: PERMISSIONS.JORNADAS_LEER,
      roles: [ROLES.CHOFER],
    },
    element: <MiJornadaPage />,
  },
  {
    id: 'legacy-mis-entregas',
    path: '/mis-entregas',
    label: 'Mi jornada',
    description: 'Redirección de compatibilidad para choferes.',
    icon: 'bi-geo-alt-fill',
    access: {
      permission: PERMISSIONS.JORNADAS_LEER,
      roles: [ROLES.CHOFER],
    },
    element: <Navigate replace to="/mi-jornada" />,
    hidden: true,
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
    path: '/jornadas/:id',
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
    id: 'legacy-centro-logistico',
    path: '/centro-logistico',
    label: 'Jornadas',
    description: 'Redirección de compatibilidad.',
    icon: 'bi-calendar2-week',
    access: {
      permission: PERMISSIONS.JORNADAS_LEER,
      roles: [ROLES.ADMIN, ROLES.LOGISTICA],
    },
    element: <Navigate replace to="/jornadas" />,
    hidden: true,
  },
  {
    id: 'legacy-jornada-detalle',
    path: '/centro-logistico/jornadas/:id',
    label: 'Detalle de jornada',
    description: 'Redirección de compatibilidad.',
    icon: 'bi-calendar2-event-fill',
    access: {
      permission: PERMISSIONS.JORNADAS_LEER,
    },
    element: <LegacyJornadaRedirect />,
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
