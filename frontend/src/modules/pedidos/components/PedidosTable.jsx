import {
  DataTable,
} from '../../../shared/ui';

import PedidoStatusBadge from './PedidoStatusBadge';

import {
  formatCurrency,
  formatDate,
  formatOrderCode,
  formatUser,
  getOrderClient,
  getOrderUser,
} from '../pedido.utils';

function PedidosTable({
  canCancelOrder,
  canCreateOrder,
  canOpenWorkspace,
  hasFilters,
  isAdmin,
  onCancel,
  onClearFilters,
  onCreate,
  onOpenWorkspace,
  onView,
  pedidos,
}) {
  const columns = [
    {
      id: 'pedido',
      header: 'Pedido',
      width: '11%',
      cell: (pedido) => (
        <div className="orders-code-cell">
          <strong>{formatOrderCode(pedido.id)}</strong>
          <small>{formatDate(pedido.fecha)}</small>
        </div>
      ),
    },
    {
      id: 'cliente',
      header: 'Cliente',
      width: '24%',
      cell: (pedido) => {
        const cliente = getOrderClient(pedido);

        return (
          <div className="orders-client-cell">
            <strong>{cliente?.nombre ?? 'No disponible'}</strong>
            <small>
              <i className="bi bi-person" aria-hidden="true" />
              CLI-{String(cliente?.id ?? 0).padStart(4, '0')}
            </small>
          </div>
        );
      },
    },
    {
      id: 'responsable',
      header: 'Responsable',
      width: '16%',
      cell: (pedido) => (
        <span className="orders-user-cell">
          {formatUser(getOrderUser(pedido))}
        </span>
      ),
    },
    {
      id: 'entrega',
      header: 'Entrega',
      width: '13%',
      cell: (pedido) => formatDate(pedido.fecha_entrega),
    },
    {
      id: 'estado',
      header: 'Estado',
      width: '15%',
      cellClassName: 'orders-status-cell',
      cell: (pedido) => (
        <PedidoStatusBadge status={pedido.estado} />
      ),
    },
    {
      id: 'total',
      header: 'Total',
      align: 'right',
      width: '12%',
      cell: (pedido) => (
        <strong className="orders-total-cell">
          {formatCurrency(pedido.total)}
        </strong>
      ),
    },
  ];

  return (
    <DataTable
      className="orders-data-table"
      caption="Listado de pedidos comerciales"
      columns={columns}
      rows={pedidos}
      emptyTitle={
        hasFilters
          ? 'No se encontraron pedidos'
          : 'No existen pedidos registrados'
      }
      emptyMessage={
        hasFilters
          ? 'Prueba con otros criterios de búsqueda o limpia los filtros.'
          : 'Crea el primer pedido para iniciar el flujo comercial.'
      }
      emptyActionLabel={
        hasFilters
          ? 'Limpiar filtros'
          : canCreateOrder
            ? 'Crear primer pedido'
            : undefined
      }
      onEmptyAction={hasFilters ? onClearFilters : onCreate}
      actions={(pedido) => {
        const editable =
          canOpenWorkspace && pedido.estado === 'PENDIENTE';
        const cancelable =
          canCancelOrder &&
          pedido.estado !== 'CANCELADO' &&
          (pedido.estado === 'PENDIENTE' ||
            (isAdmin &&
              !['DESPACHADO', 'ENTREGADO'].includes(pedido.estado)));

        return [
          {
            id: 'view',
            icon: 'bi bi-eye',
            label: 'Ver detalle',
            onClick: () => onView?.(pedido),
          },
          {
            id: 'edit',
            icon: 'bi bi-layout-text-window-reverse',
            label: editable
              ? 'Abrir Workspace'
              : 'Workspace no disponible',
            visible: editable,
            onClick: () => onOpenWorkspace?.(pedido),
          },
          {
            id: 'delete',
            icon: 'bi bi-slash-circle',
            label: cancelable
              ? 'Cancelar pedido'
              : 'Pedido no cancelable',
            tone: 'danger',
            visible: cancelable,
            onClick: () => onCancel?.(pedido),
          },
        ];
      }}
    />
  );
}

export default PedidosTable;
