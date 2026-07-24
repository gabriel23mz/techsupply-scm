import DashboardPage from '../../modules/dashboard/pages/DashboardPage';
import ClientesPage from '../../modules/clientes/pages/ClientesPage';
import PedidosPage from '../../modules/pedidos/pages/PedidosPage';
import UbicacionesPage from '../../modules/ubicaciones/pages/UbicacionesPage';
import RutasPage from '../../modules/rutas/pages/RutasPage';
import CentroLogisticoPage from '../../modules/logistica/pages/CentroLogisticoPage';
import DespachosPage from '../../modules/despachos/pages/DespachosPage';

import NuevoPedidoPage from '../../modules/pedidos/pages/NuevoPedidoPage';
import PedidoWorkspacePage from '../../modules/pedidos/pages/PedidoWorkspacePage';

import JornadaDetallePage from '../../modules/logistica/pages/JornadaDetallePage';


export const navigation = [
  {
    path: '/',
    label: 'Dashboard',
    description: 'Vista operativa del módulo Outbound',
    icon: 'bi-grid-1x2-fill',
    permission: 'PEDIDOS_LEER',
    element: <DashboardPage />,
  },
  {
    path: '/clientes',
    label: 'Clientes',
    description: 'Gestión de clientes registrados',
    icon: 'bi-people',
    permission: 'CLIENTES_LEER',
    element: <ClientesPage />,
  },
  {
    path: '/pedidos',
    label: 'Pedidos',
    description: 'Gestión y seguimiento de pedidos',
    icon: 'bi-receipt',
    permission: 'PEDIDOS_LEER',
    element: <PedidosPage />,
  },
  {
    path: '/ubicaciones',
    label: 'Ubicaciones',
    description: 'Gestión de ubicaciones operativas',
    icon: 'bi-geo-alt',
    permission: 'UBICACIONES_LEER',
    element: <UbicacionesPage />,
  },
  {
    path: '/rutas',
    label: 'Rutas',
    description: 'Gestión, configuración y control de rutas logísticas',
    icon: 'bi-signpost-split',
    permission: 'RUTAS_LEER',
    element: <RutasPage />,
  },
  {
    path: '/centro-logistico',
    label: 'Centro Logístico',
    description: 'Centro de operaciones logísticas',
    icon: 'bi-box-seam',
    permission: 'JORNADAS_LEER',
    element: <CentroLogisticoPage />,
  },
  {
    path: '/despachos',
    label: 'Despachos',
    description: 'Gestión y control de despachos',
    icon: 'bi-truck',
    permission: 'DESPACHOS_LEER',
    element: <DespachosPage />,
  },
  {
    path: '/pedidos/nuevo',
    label: 'Nuevo Pedido',
    description: 'Registro inicial del pedido antes de agregar productos.',
    icon: 'bi-plus-circle',
    permission: 'PEDIDOS_CREAR',
    element: <NuevoPedidoPage />,
    hidden: true,
  },
  {
    path: '/pedidos/:id/workspace',
    label: 'Workspace de Detalles',
    description: 'Gestión de productos asociados al pedido.',
    icon: 'bi-layout-text-window-reverse',
    permission: 'PEDIDOS_LEER',
    element: <PedidoWorkspacePage />,
    hidden: true,
  },
  {
    path: '/centro-logistico/jornadas/:id',
    label: 'Detalle de Jornada',
    description: 'Seguimiento operativo de la jornada y sus entregas.',
    icon: 'bi-calendar2-event-fill',
    permission: 'JORNADAS_LEER',
    element: <JornadaDetallePage />,
    hidden: true,
  }
];

