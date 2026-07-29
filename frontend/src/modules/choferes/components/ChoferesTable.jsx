import {
  DataTable,
} from '../../../shared/ui';

import ChoferStatusBadge from './ChoferStatusBadge';

import {
  getDriverStatus,
} from '../choferStatus.utils';

function formatDriverCode(id) {
  return `CHF-${String(id ?? 0).padStart(4, '0')}`;
}

function formatDate(value) {
  if (!value) return 'No registrada';

  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);

  return Number.isNaN(date.getTime())
    ? 'No registrada'
    : new Intl.DateTimeFormat('es-EC').format(date);
}

function getName(chofer) {
  return [chofer?.usuario?.nombre, chofer?.usuario?.apellido]
    .filter(Boolean)
    .join(' ') || 'Usuario no disponible';
}

function ChoferesTable({
  canManage,
  choferes,
  error,
  hasFilters,
  loading,
  onDeactivate,
  onEdit,
  onRetry,
  onView,
}) {
  return (
    <DataTable
      className="drivers-table"
      caption="Directorio de choferes"
      loading={loading}
      error={error}
      onRetry={onRetry}
      rows={choferes}
      emptyTitle={hasFilters
        ? 'No se encontraron choferes'
        : 'No existen choferes registrados'}
      emptyMessage={hasFilters
        ? 'Prueba con otros criterios de búsqueda o estado.'
        : 'Los perfiles operativos aparecerán cuando sean registrados.'}
      columns={[
        {
          id: 'chofer',
          header: 'Chofer',
          width: '24%',
          cell: (chofer) => (
            <div className="drivers-primary-cell">
              <strong>{getName(chofer)}</strong>
              <span>{formatDriverCode(chofer.id)}</span>
            </div>
          ),
        },
        {
          id: 'contacto',
          header: 'Contacto',
          width: '20%',
          cell: (chofer) => (
            <div className="drivers-primary-cell">
              <strong>{chofer.usuario?.correo ?? 'Sin correo'}</strong>
              <span>{chofer.usuario?.estado === false ? 'Usuario inactivo' : 'Usuario activo'}</span>
            </div>
          ),
        },
        {
          id: 'licencia',
          header: 'Licencia',
          width: '18%',
          cell: (chofer) => (
            <div className="drivers-primary-cell">
              <strong>{chofer.numero_licencia}</strong>
              <span>Categoría {chofer.categoria_licencia}</span>
            </div>
          ),
        },
        {
          id: 'vencimiento',
          header: 'Vencimiento',
          width: '15%',
          cell: (chofer) => formatDate(chofer.fecha_vencimiento_licencia),
        },
        {
          id: 'estado',
          header: 'Estado',
          width: '16%',
          cell: (chofer) => <ChoferStatusBadge chofer={chofer} />,
        },
      ]}
      actions={(chofer) => {
        const hasActiveJourney = getDriverStatus(chofer) === 'EN_JORNADA';

        return [
          {
            id: 'view',
            icon: 'bi bi-eye',
            label: 'Ver chofer',
            onClick: () => onView(chofer),
          },
          {
            id: 'edit',
            icon: 'bi bi-pencil-square',
            label: 'Editar chofer',
            visible: canManage,
            tone: 'primary',
            onClick: () => onEdit(chofer),
          },
          {
            id: 'delete',
            icon: 'bi bi-slash-circle',
            label: hasActiveJourney
              ? 'No se puede desactivar con jornada activa'
              : 'Desactivar chofer',
            disabled: hasActiveJourney || !chofer.activo,
            visible: canManage,
            tone: 'danger',
            onClick: () => onDeactivate(chofer),
          },
        ];
      }}
    />
  );
}

export default ChoferesTable;
