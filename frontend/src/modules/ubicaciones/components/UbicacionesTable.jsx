import {
  DataTable,
} from '../../../shared/ui';

import {
  formatCoordinate,
} from '../ubicacion.utils';

function UbicacionesTable({
  canManage,
  onDeactivate,
  onEdit,
  onView,
  ubicaciones,
}) {
  const columns = [
    {
      id: 'ubicacion',
      header: 'Ubicación',
      width: '46%',
      cell: (ubicacion) => (
        <div className="locations-name-cell">
          <strong>{ubicacion.nombre}</strong>
          <small>
            <i className="bi bi-geo-alt" aria-hidden="true" />
            UBI-{String(ubicacion.id).padStart(4, '0')}
          </small>
        </div>
      ),
    },
    {
      id: 'latitud',
      header: 'Latitud',
      width: '21%',
      cell: (ubicacion) => formatCoordinate(ubicacion.latitud),
    },
    {
      id: 'longitud',
      header: 'Longitud',
      width: '21%',
      cell: (ubicacion) => formatCoordinate(ubicacion.longitud),
    },
  ];

  return (
    <DataTable
      className="locations-data-table"
      caption="Catálogo de ubicaciones"
      columns={columns}
      rows={ubicaciones}
      emptyTitle="No hay ubicaciones para mostrar"
      emptyMessage="Ajusta los filtros o registra una nueva ubicación."
      actions={(ubicacion) => [
        {
          id: 'view',
          icon: 'bi bi-eye',
          label: 'Ver detalle',
          onClick: () => onView?.(ubicacion),
        },
        {
          id: 'edit',
          icon: 'bi bi-pencil-square',
          label: 'Editar ubicación',
          visible: canManage,
          onClick: () => onEdit?.(ubicacion),
        },
        {
          id: 'delete',
          icon: 'bi bi-slash-circle',
          label: 'Desactivar ubicación',
          tone: 'danger',
          visible: canManage && ubicacion.estado !== false,
          onClick: () => onDeactivate?.(ubicacion),
        },
      ]}
    />
  );
}

export default UbicacionesTable;
