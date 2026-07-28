import {
  DataTable,
} from '../../../shared/ui';

import {
  formatWarehouseDate,
  formatWarehouseJourneyCode,
  formatWarehouseTruckLabel,
  getLoadProgress,
  getWarehouseDispatches,
} from '../bodega.utils';

import LoadProgress from './LoadProgress';
import LoadStatusBadge from './LoadStatusBadge';

function LoadTable({
  hasFilters,
  jornadas,
  onClearFilters,
  onLoad,
  onView,
}) {
  const columns = [
    {
      id: 'jornada',
      header: 'Jornada',
      width: '14%',
      cell: (jornada) => (
        <div className="warehouse-load-journey-cell">
          <strong>{formatWarehouseJourneyCode(jornada.id)}</strong>
          <small>{formatWarehouseDate(jornada.fecha)}</small>
        </div>
      ),
    },
    {
      id: 'camion',
      header: 'Camión',
      width: '20%',
      cell: (jornada) => (
        <div className="warehouse-load-truck-cell">
          <strong>{formatWarehouseTruckLabel(jornada?.camion)}</strong>
          <small>
            {jornada?.camion?.descripcion ?? 'Unidad asignada'}
          </small>
        </div>
      ),
    },
    {
      id: 'despachos',
      header: 'Despachos',
      width: '13%',
      align: 'center',
      cell: (jornada) => {
        const dispatches = getWarehouseDispatches(jornada);
        const progress = getLoadProgress(jornada);

        return (
          <div className="warehouse-load-count-cell">
            <strong>{dispatches.length}</strong>
            <small>{progress.loaded} cargados</small>
          </div>
        );
      },
    },
    {
      id: 'progreso',
      header: 'Progreso',
      width: '25%',
      cell: (jornada) => (
        <LoadProgress compact jornada={jornada} />
      ),
    },
    {
      id: 'estado',
      header: 'Estado',
      width: '16%',
      cell: (jornada) => (
        <LoadStatusBadge jornada={jornada} />
      ),
    },
  ];

  return (
    <DataTable
      className="warehouse-load-table"
      caption="Jornadas planificadas disponibles para carga"
      columns={columns}
      rows={jornadas}
      emptyTitle={
        hasFilters
          ? 'No se encontraron jornadas'
          : 'No hay jornadas pendientes de carga'
      }
      emptyMessage={
        hasFilters
          ? 'Prueba con otra búsqueda o limpia los filtros aplicados.'
          : 'Las jornadas planificadas por Logística aparecerán aquí.'
      }
      emptyActionLabel={hasFilters ? 'Limpiar filtros' : undefined}
      onEmptyAction={hasFilters ? onClearFilters : undefined}
      actions={(jornada) => [
        {
          id: 'view',
          icon: 'bi bi-eye',
          label: 'Ver detalle de carga',
          onClick: () => onView?.(jornada),
        },
        {
          id: 'edit',
          icon: 'bi bi-truck-flatbed',
          label: 'Abrir carga',
          onClick: () => onLoad?.(jornada),
        },
      ]}
    />
  );
}

export default LoadTable;
