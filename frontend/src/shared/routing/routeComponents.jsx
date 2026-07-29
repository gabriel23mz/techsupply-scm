import {
  lazy,
} from 'react';

export const BodegaCargasPage = lazy(() =>
  import('../../modules/bodega/pages/CargasPage'),
);

export const BodegaCargaWorkspacePage = lazy(() =>
  import('../../modules/bodega/pages/CargaWorkspacePage'),
);

export const BodegaPreparacionPage = lazy(() =>
  import('../../modules/bodega/pages/PreparacionPage'),
);

export const BodegaPreparacionWorkspacePage = lazy(() =>
  import('../../modules/bodega/pages/PreparacionWorkspacePage'),
);

export const ClientesPage = lazy(() =>
  import('../../modules/clientes/pages/ClientesPage'),
);

export const DespachosPage = lazy(() =>
  import('../../modules/despachos/pages/DespachosPage'),
);

export const ChoferesPage = lazy(() =>
  import('../../modules/choferes/pages/ChoferesPage'),
);

export const DashboardPage = lazy(() =>
  import('../../modules/dashboard/pages/DashboardPage'),
);

export const JornadasPage = lazy(() =>
  import('../../modules/logistica/pages/JornadasPage'),
);

export const CamionesPage = lazy(() =>
  import('../../modules/camiones/pages/CamionesPage'),
);

export const JornadaDetallePage = lazy(() =>
  import('../../modules/logistica/pages/JornadaDetallePage'),
);

export const MiJornadaPage = lazy(() =>
  import('../../modules/chofer/pages/MiJornadaPage'),
);

export const NuevoPedidoPage = lazy(() =>
  import('../../modules/pedidos/pages/NuevoPedidoPage'),
);

export const PedidosPage = lazy(() =>
  import('../../modules/pedidos/pages/PedidosPage'),
);

export const PedidoWorkspacePage = lazy(() =>
  import('../../modules/pedidos/pages/PedidoWorkspacePage'),
);

export const RutasPage = lazy(() =>
  import('../../modules/rutas/pages/RutasPage'),
);

export const UbicacionesPage = lazy(() =>
  import('../../modules/ubicaciones/pages/UbicacionesPage'),
);

export const AccessDeniedPage = lazy(() =>
  import('../pages/AccessDeniedPage'),
);

export const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage'),
);
