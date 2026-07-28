import {
  PERMISSIONS,
} from '../../../shared/constants/permissions';

import {
  DataTable,
  StatusBadge,
} from '../../../shared/ui';

function getLocation(cliente) {
  return cliente?.ubicacion ?? null;
}

function formatClientCode(id) {
  return `CLI-${String(id ?? 0).padStart(4, '0')}`;
}

function formatDate(value) {
  if (!value) {
    return 'Sin fecha';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
  }).format(date);
}

function ClientesTable({
  canManage,
  clientes,
  error,
  hasFilters,
  isLoading,
  onClearFilters,
  onCreate,
  onDeactivate,
  onEdit,
  onRetry,
  onView,
}) {
  const columns = [
    {
      id: 'cliente',
      header: 'Cliente',
      width: '20%',
      cell: (cliente) => (
        <div className="clients-name-cell">
          <strong title={cliente.nombre}>
            {cliente.nombre}
          </strong>
          <small>
            <i className="bi bi-person" aria-hidden="true" />
            {formatClientCode(cliente.id)}
          </small>
        </div>
      ),
    },
    {
      id: 'identificacion',
      header: 'Identificación',
      accessor: 'identificacion',
      width: '11%',
      cellClassName: 'clients-identification',
    },
    {
      id: 'contacto',
      header: 'Contacto',
      width: '19%',
      cell: (cliente) => (
        <div className="clients-contact-cell">
          <span>
            <i className="bi bi-telephone" aria-hidden="true" />
            {cliente.telefono || 'Sin teléfono'}
          </span>
          <span title={cliente.correo}>
            <i className="bi bi-envelope" aria-hidden="true" />
            {cliente.correo || 'Sin correo'}
          </span>
        </div>
      ),
    },
    {
      id: 'ubicacion',
      header: 'Ubicación y entrega',
      width: '22%',
      cell: (cliente) => {
        const ubicacion = getLocation(cliente);

        return (
          <div className="clients-location-cell">
            <strong>
              <i className="bi bi-geo-alt-fill" aria-hidden="true" />
              {ubicacion?.nombre ?? 'No disponible'}
            </strong>
            <small title={cliente.direccion}>
              {cliente.direccion || 'Sin dirección'}
            </small>
          </div>
        );
      },
    },
    {
      id: 'estado',
      header: 'Estado',
      width: '9%',
      cellClassName: 'clients-status-cell',
      cell: (cliente) => (
        <StatusBadge
          tone={cliente.estado === false ? 'neutral' : 'success'}
          size="sm"
        >
          {cliente.estado === false ? 'Inactivo' : 'Activo'}
        </StatusBadge>
      ),
    },
    {
      id: 'registro',
      header: 'Registro',
      width: '9%',
      cellClassName: 'clients-registration',
      cell: (cliente) => formatDate(
        cliente.created_at ?? cliente.createdAt,
      ),
    },
  ];

  return (
    <DataTable
      className="clients-data-table"
      caption="Directorio de clientes"
      columns={columns}
      rows={clientes}
      loading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle={
        hasFilters
          ? 'No se encontraron clientes'
          : 'No existen clientes registrados'
      }
      emptyMessage={
        hasFilters
          ? 'Ajusta la búsqueda o limpia los filtros para volver a consultar el directorio.'
          : 'Registra el primer cliente para comenzar a gestionar pedidos y entregas.'
      }
      emptyActionLabel={
        hasFilters
          ? 'Limpiar filtros'
          : canManage
            ? 'Registrar cliente'
            : undefined
      }
      onEmptyAction={
        hasFilters
          ? onClearFilters
          : canManage
            ? onCreate
            : undefined
      }
      actions={(cliente) => [
        {
          id: 'view',
          icon: 'bi bi-eye',
          label: 'Ver detalle',
          onClick: () => onView(cliente),
        },
        {
          id: 'edit',
          icon: 'bi bi-pencil-square',
          label: 'Editar cliente',
          permission: PERMISSIONS.CLIENTES_GESTIONAR,
          visible: canManage,
          onClick: () => onEdit(cliente),
        },
        {
          id: 'delete',
          icon: 'bi bi-slash-circle',
          label: 'Desactivar cliente',
          tone: 'danger',
          visible: canManage && cliente.estado !== false,
          onClick: () => onDeactivate(cliente),
        },
      ]}
    />
  );
}

export default ClientesTable;
