import {
  DataTable,
  StatusBadge,
} from '../../../shared/ui';

import {
  formatUserDate,
  getUserFullName,
  getUserRoleIcon,
  getUserRoleLabel,
  getUserRoleTone,
} from '../usuario.utils';

function UsuariosTable({
  error,
  hasFilters,
  isLoading,
  onClearFilters,
  onCreate,
  onDeactivate,
  onEdit,
  onRetry,
  onView,
  usuarios,
}) {
  const columns = [
    {
      id: 'usuario',
      header: 'Usuario',
      width: '29%',
      cell: (usuario) => (
        <div className="users-primary-cell">
          <strong>{getUserFullName(usuario)}</strong>
          <small>
            <i className="bi bi-person-check" aria-hidden="true" />
            Cuenta activa
          </small>
        </div>
      ),
    },
    {
      id: 'correo',
      header: 'Correo',
      width: '28%',
      cell: (usuario) => (
        <span className="users-email-cell" title={usuario.correo}>
          <i className="bi bi-envelope" aria-hidden="true" />
          {usuario.correo || 'No disponible'}
        </span>
      ),
    },
    {
      id: 'rol',
      header: 'Rol',
      width: '20%',
      cell: (usuario) => (
        <StatusBadge
          tone={getUserRoleTone(usuario.rol)}
          icon={getUserRoleIcon(usuario.rol)}
        >
          {getUserRoleLabel(usuario.rol)}
        </StatusBadge>
      ),
    },
    {
      id: 'registro',
      header: 'Registro',
      width: '13%',
      cell: (usuario) => (
        <span className="users-date-cell">
          {formatUserDate(
            usuario.created_at ?? usuario.createdAt,
          )}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      className="users-data-table"
      caption="Usuarios activos del sistema"
      columns={columns}
      rows={usuarios}
      loading={isLoading}
      error={error}
      emptyTitle={
        hasFilters
          ? 'No hay usuarios que coincidan'
          : 'No existen usuarios activos'
      }
      emptyMessage={
        hasFilters
          ? 'Ajusta o limpia los filtros para consultar otros registros.'
          : 'Registra una cuenta para habilitar el acceso de una persona al sistema.'
      }
      emptyActionLabel={
        hasFilters ? 'Limpiar filtros' : 'Nuevo usuario'
      }
      onEmptyAction={hasFilters ? onClearFilters : onCreate}
      onRetry={onRetry}
      actions={(usuario) => [
        {
          id: 'view',
          label: `Ver ${getUserFullName(usuario)}`,
          icon: 'bi bi-eye',
          tone: 'ghost',
          onClick: () => onView(usuario),
        },
        {
          id: 'edit',
          label: `Editar ${getUserFullName(usuario)}`,
          icon: 'bi bi-pencil-square',
          tone: 'primary',
          onClick: () => onEdit(usuario),
        },
        {
          id: 'delete',
          label: `Desactivar ${getUserFullName(usuario)}`,
          icon: 'bi bi-slash-circle',
          tone: 'danger',
          onClick: () => onDeactivate(usuario),
        },
      ]}
    />
  );
}

export default UsuariosTable;
