import {
  DataTable,
  StatusBadge,
} from '../../../../shared/ui';

function formatRouteCode(id) {
  return `RUT-${String(id).padStart(4, '0')}`;
}

function formatDistance(value) {
  const distance = Number(value);

  return Number.isFinite(distance)
    ? `${new Intl.NumberFormat('es-EC', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(distance)} km`
    : '0,00 km';
}

function formatDate(value) {
  if (!value) return 'Sin fecha';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Sin fecha'
    : new Intl.DateTimeFormat('es-EC').format(date);
}

function RutasTable({
  canManage,
  error,
  hasFilters,
  loading,
  onDeactivate,
  onEdit,
  onRetry,
  onView,
  rutas,
}) {
  return (
    <DataTable
      className="routes-catalog-table"
      caption="Catálogo de rutas"
      loading={loading}
      error={error}
      onRetry={onRetry}
      rows={rutas}
      emptyTitle={
        hasFilters
          ? 'No se encontraron rutas'
          : 'No existen rutas registradas'
      }
      emptyMessage={
        hasFilters
          ? 'Prueba con otros criterios de búsqueda u origen y destino.'
          : 'Las conexiones entre ubicaciones aparecerán cuando sean creadas.'
      }
      columns={[
        {
          id: 'ruta',
          header: 'Ruta',
          width: '14%',
          cell: (ruta) => <strong>{formatRouteCode(ruta.id)}</strong>,
        },
        {
          id: 'origen',
          header: 'Origen',
          width: '23%',
          cell: (ruta) => (
            <div className="routes-location-cell">
              <i className="bi bi-geo-alt-fill" aria-hidden="true" />
              <span>{ruta.origen?.nombre ?? 'Origen no disponible'}</span>
            </div>
          ),
        },
        {
          id: 'destino',
          header: 'Destino',
          width: '23%',
          cell: (ruta) => (
            <div className="routes-location-cell">
              <i className="bi bi-flag-fill" aria-hidden="true" />
              <span>{ruta.destino?.nombre ?? 'Destino no disponible'}</span>
            </div>
          ),
        },
        {
          id: 'distancia',
          header: 'Distancia',
          width: '15%',
          cell: (ruta) => <strong>{formatDistance(ruta.distancia_km)}</strong>,
        },
        {
          id: 'estado',
          header: 'Estado',
          width: '12%',
          cell: () => (
            <StatusBadge tone="success" icon="bi bi-check-circle" dot={false}>
              Activa
            </StatusBadge>
          ),
        },
        {
          id: 'fecha',
          header: 'Registro',
          width: '13%',
          cell: (ruta) => formatDate(ruta.created_at ?? ruta.createdAt),
        },
      ]}
      actions={(ruta) => [
        {
          id: 'view',
          icon: 'bi bi-eye',
          label: 'Ver ruta',
          onClick: () => onView(ruta),
        },
        {
          id: 'edit',
          icon: 'bi bi-pencil-square',
          label: 'Editar ruta',
          visible: canManage,
          tone: 'primary',
          onClick: () => onEdit(ruta),
        },
        {
          id: 'delete',
          icon: 'bi bi-slash-circle',
          label: 'Desactivar ruta',
          visible: canManage,
          tone: 'danger',
          onClick: () => onDeactivate(ruta),
        },
      ]}
    />
  );
}

export default RutasTable;
