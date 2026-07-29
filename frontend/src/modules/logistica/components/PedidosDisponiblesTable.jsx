import {
  DataTable,
  StatusBadge,
} from '../../../shared/ui';

function formatPedidoId(id) {
  return `PED-${String(id).padStart(4, '0')}`;
}

function formatCurrency(value) {
  const amount = Number(value);

  return Number.isFinite(amount)
    ? new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
    : '$0,00';
}

function formatDate(value) {
  if (!value) return 'Sin fecha';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Fecha inválida'
    : new Intl.DateTimeFormat('es-EC').format(date);
}

function PedidosDisponiblesTable({
  error,
  loading,
  onRetry,
  pedidos,
}) {
  const columns = [
    {
      id: 'pedido',
      header: 'Pedido',
      width: '13%',
      cell: (pedido) => (
        <div className="journeys-primary-cell">
          <strong>{formatPedidoId(pedido.id)}</strong>
          <span>ID interno: {pedido.id}</span>
        </div>
      ),
    },
    {
      id: 'cliente',
      header: 'Cliente',
      width: '19%',
      cell: (pedido) => (
        <div className="journeys-primary-cell">
          <strong>{pedido.cliente?.nombre ?? 'Cliente no disponible'}</strong>
          <span>{pedido.cliente?.identificacion ?? 'Sin identificación'}</span>
        </div>
      ),
    },
    {
      id: 'destino',
      header: 'Destino',
      width: '23%',
      cell: (pedido) => (
        <div className="journeys-primary-cell">
          <strong>
            {pedido.cliente?.ubicacion?.nombre ?? 'Ubicación no disponible'}
          </strong>
          <span>{pedido.cliente?.direccion ?? 'Sin dirección registrada'}</span>
        </div>
      ),
    },
    {
      id: 'fecha',
      header: 'Entrega',
      width: '13%',
      cell: (pedido) => formatDate(pedido.fecha_entrega),
    },
    {
      id: 'total',
      header: 'Total',
      width: '13%',
      cell: (pedido) => <strong>{formatCurrency(pedido.total)}</strong>,
    },
    {
      id: 'estado',
      header: 'Estado',
      width: '19%',
      cell: () => (
        <StatusBadge tone="success" icon="bi bi-box-seam" dot={false}>
          Listo para despacho
        </StatusBadge>
      ),
    },
  ];

  return (
    <DataTable
      className="journeys-orders-table"
      caption="Pedidos disponibles para generar jornadas"
      columns={columns}
      rows={pedidos}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No existen pedidos disponibles"
      emptyMessage="Los pedidos listos para despacho aparecerán aquí para la siguiente planificación."
    />
  );
}

export default PedidosDisponiblesTable;
