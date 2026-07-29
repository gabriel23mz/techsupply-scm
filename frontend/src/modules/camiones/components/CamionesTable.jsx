import {
  DataTable,
} from '../../../shared/ui';

import CamionStatusBadge from './CamionStatusBadge';

function formatCapacity(value) {
  const capacity = Number(value);

  return Number.isFinite(capacity)
    ? `${capacity} pedido${capacity === 1 ? '' : 's'}`
    : 'Sin capacidad';
}

function CamionesTable({
  camiones,
  canManage,
  error,
  hasFilters,
  loading,
  onDeactivate,
  onEdit,
  onOpenJourney,
  onRetry,
  onView,
}) {
  const columns = [
    {
      id: 'codigo',
      header: 'Camión',
      width: '16%',
      cell: (camion) => (
        <div className="trucks-primary-cell">
          <strong>{camion.codigo}</strong>
          <span>{camion.placa}</span>
        </div>
      ),
    },
    {
      id: 'capacidad',
      header: 'Capacidad',
      width: '15%',
      cell: (camion) => formatCapacity(camion.capacidad),
    },
    {
      id: 'ocupacion',
      header: 'Ocupación',
      width: '20%',
      cell: (camion) => (
        <div className="trucks-occupancy">
          <div>
            <span>{camion.pedidos_asignados ?? 0} asignados</span>
            <strong>{camion.porcentaje_ocupacion ?? 0}%</strong>
          </div>
          <progress
            max="100"
            value={camion.porcentaje_ocupacion ?? 0}
            aria-label={`Ocupación de ${camion.codigo}`}
          />
        </div>
      ),
    },
    {
      id: 'jornada',
      header: 'Jornada vigente',
      width: '20%',
      cell: (camion) => camion.jornada ? (
        <button
          type="button"
          className="trucks-journey-link"
          onClick={() => onOpenJourney(camion.jornada)}
        >
          <strong>{camion.jornada.codigo}</strong>
          <span>{String(camion.jornada.estado).replaceAll('_', ' ')}</span>
        </button>
      ) : (
        <span className="trucks-muted">Sin jornada activa</span>
      ),
    },
    {
      id: 'estado',
      header: 'Estado',
      width: '14%',
      cell: (camion) => (
        <CamionStatusBadge estado={camion.estado} />
      ),
    },
  ];

  return (
    <DataTable
      className="trucks-table"
      caption="Listado de camiones"
      columns={columns}
      rows={camiones}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyTitle={
        hasFilters
          ? 'No se encontraron camiones'
          : 'No existen camiones registrados'
      }
      emptyMessage={
        hasFilters
          ? 'Prueba con otros criterios de búsqueda o estado.'
          : 'La flota aparecerá aquí cuando existan camiones registrados.'
      }
      actions={(camion) => [
        {
          id: 'view',
          icon: 'bi bi-eye',
          label: 'Ver camión',
          onClick: () => onView(camion),
        },
        {
          id: 'edit',
          icon: 'bi bi-pencil-square',
          label: camion.tiene_jornada
            ? 'No se puede editar con jornada activa'
            : 'Editar camión',
          disabled: camion.tiene_jornada,
          visible: canManage,
          tone: 'primary',
          onClick: () => onEdit(camion),
        },
        {
          id: 'delete',
          icon: 'bi bi-slash-circle',
          label: camion.tiene_jornada
            ? 'No se puede desactivar con jornada activa'
            : 'Desactivar camión',
          disabled:
            camion.tiene_jornada || camion.estado === 'INACTIVO',
          visible: canManage,
          tone: 'danger',
          onClick: () => onDeactivate(camion),
        },
      ]}
    />
  );
}

export default CamionesTable;
