import {
  DataTable,
} from '../../../shared/ui';

import {
  formatWarehouseClientCode,
  formatWarehouseDate,
  formatWarehouseOrderCode,
  getPreparationProgress,
  getWarehouseClient,
  getWarehouseDetails,
  getWarehouseLocation,
} from '../bodega.utils';

import PreparationProgress from './PreparationProgress';
import PreparationStatusBadge from './PreparationStatusBadge';

function PreparationTable({
  hasFilters,
  onClearFilters,
  onPrepare,
  onView,
  pedidos,
}) {
  const columns = [
    {
      id: 'pedido',
      header: 'Pedido',
      width: '12%',
      cell: (pedido) => (
        <div className="warehouse-order-cell">
          <strong>{formatWarehouseOrderCode(pedido.id)}</strong>
          <small>{formatWarehouseDate(pedido.fecha)}</small>
        </div>
      ),
    },
    {
      id: 'cliente',
      header: 'Cliente',
      width: '21%',
      cell: (pedido) => {
        const client = getWarehouseClient(pedido);

        return (
          <div className="warehouse-client-cell">
            <strong>{client?.nombre ?? 'No disponible'}</strong>
            <small>
              <i className="bi bi-person" aria-hidden="true" />
              {formatWarehouseClientCode(client?.id)}
            </small>
          </div>
        );
      },
    },
    {
      id: 'ubicacion',
      header: 'Ubicación',
      width: '16%',
      cell: (pedido) => {
        const location = getWarehouseLocation(pedido);

        return (
          <div className="warehouse-location-cell">
            <strong>
              <i className="bi bi-geo-alt" aria-hidden="true" />
              {location?.nombre ?? 'Sin ubicación'}
            </strong>
            <small>{getWarehouseClient(pedido)?.direccion ?? 'Sin dirección'}</small>
          </div>
        );
      },
    },
    {
      id: 'productos',
      header: 'Productos',
      width: '10%',
      align: 'center',
      cell: (pedido) => {
        const details = getWarehouseDetails(pedido);
        const progress = getPreparationProgress(pedido);

        return (
          <div className="warehouse-products-cell">
            <strong>{details.length}</strong>
            <small>{progress.requested} unidades</small>
          </div>
        );
      },
    },
    {
      id: 'progreso',
      header: 'Progreso',
      width: '18%',
      cell: (pedido) => (
        <PreparationProgress compact pedido={pedido} />
      ),
    },
    {
      id: 'estado',
      header: 'Estado',
      width: '11%',
      cell: (pedido) => (
        <PreparationStatusBadge pedido={pedido} />
      ),
    },
  ];

  return (
    <DataTable
      className="warehouse-preparation-table"
      caption="Pedidos disponibles para preparación en Bodega"
      columns={columns}
      rows={pedidos}
      emptyTitle={
        hasFilters
          ? 'No se encontraron pedidos'
          : 'No hay pedidos en preparación'
      }
      emptyMessage={
        hasFilters
          ? 'Prueba con otra búsqueda o limpia los filtros aplicados.'
          : 'Los pedidos enviados desde Ventas aparecerán aquí automáticamente.'
      }
      emptyActionLabel={hasFilters ? 'Limpiar filtros' : undefined}
      onEmptyAction={hasFilters ? onClearFilters : undefined}
      actions={(pedido) => [
        {
          id: 'view',
          icon: 'bi bi-eye',
          label: 'Ver detalle de preparación',
          onClick: () => onView?.(pedido),
        },
        {
          id: 'edit',
          icon: 'bi bi-clipboard2-check',
          label: 'Abrir preparación',
          onClick: () => onPrepare?.(pedido),
        },
      ]}
    />
  );
}

export default PreparationTable;
