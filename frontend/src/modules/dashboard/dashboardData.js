export const dashboardMockData = {
  primaryMetrics: [
    {
      title: 'Pedidos pendientes',
      value: 124,
      description: '+12% vs ayer',
      icon: 'bi-receipt',
      variant: 'danger',
    },
    {
      title: 'Listos para despacho',
      value: 45,
      description: 'En muelle de salida',
      icon: 'bi-box-seam',
      variant: 'info',
    },
    {
      title: 'Despachos activos',
      value: 12,
      description: 'En ruta nacional',
      icon: 'bi-truck',
      variant: 'primary',
    },
    {
      title: 'Entregados hoy',
      value: 89,
      description: 'KPI: 98% cumplimiento',
      icon: 'bi-check-circle',
      variant: 'success',
    },
  ],

  masterRecords: [
    { label: 'Clientes registrados', value: '1,200', icon: 'bi-people' },
    { label: 'Ubicaciones registradas', value: 340, icon: 'bi-geo-alt' },
    { label: 'Rutas configuradas', value: 56, icon: 'bi-signpost-split' },
  ],

  quickAccess: [
    {
      title: 'Gestión Clientes',
      description: 'Base de datos CRM',
      icon: 'bi-person-lines-fill',
      path: '/clientes',
    },
    {
      title: 'Gestión Pedidos',
      description: 'Ingreso y validación',
      icon: 'bi-cart-check',
      path: '/pedidos',
    },
    {
      title: 'Gestión Ubicaciones',
      description: 'Nodos y almacenes',
      icon: 'bi-map',
      path: '/ubicaciones',
    },
    {
      title: 'Gestión Rutas',
      description: 'Optimización y zonas',
      icon: 'bi-signpost-2',
      path: '/rutas',
    },
    {
      title: 'Centro de Operaciones',
      description: 'Supervisión total de logística',
      icon: 'bi-diagram-3',
      path: '/centro-logistico',
      featured: true,
    },
  ],
};


