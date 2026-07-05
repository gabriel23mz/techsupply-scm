import DashboardPage from '../../modules/dashboard/pages/DashboardPage';
import ClientesPage from '../../modules/clientes/pages/ClientesPage';
import PedidosPage from '../../modules/pedidos/pages/PedidosPage';
import UbicacionesPage from '../../modules/ubicaciones/pages/UbicacionesPage';
import RutasPage from '../../modules/rutas/pages/RutasPage';
import CentroLogisticoPage from '../../modules/logistica/pages/CentroLogisticoPage';
import DespachosPage from '../../modules/despachos/pages/DespachosPage';

export const navigation = [
  {
    path: '/',
    label: 'Dashboard',
    description: 'Vista operativa del módulo Outbound',
    icon: 'bi-grid-1x2-fill',
    element: <DashboardPage />,
  },
  {
    path: '/clientes',
    label: 'Clientes',
    description: 'Gestión de clientes registrados',
    icon: 'bi-people',
    element: <ClientesPage />,
  },
  {
    path: '/pedidos',
    label: 'Pedidos',
    description: 'Gestión y seguimiento de pedidos',
    icon: 'bi-receipt',
    element: <PedidosPage />,
  },
  {
    path: '/ubicaciones',
    label: 'Ubicaciones',
    description: 'Gestión de ubicaciones operativas',
    icon: 'bi-geo-alt',
    element: <UbicacionesPage />,
  },
  {
    path: '/rutas',
    label: 'Rutas',
    description: 'Configuración de rutas logísticas',
    icon: 'bi-signpost-split',
    element: <RutasPage />,
  },
  {
    path: '/centro-logistico',
    label: 'Centro Logístico',
    description: 'Centro de operaciones logísticas',
    icon: 'bi-box-seam',
    element: <CentroLogisticoPage />,
  },
  {
    path: '/despachos',
    label: 'Despachos',
    description: 'Gestión y control de despachos',
    icon: 'bi-truck',
    element: <DespachosPage />,
  },
];

