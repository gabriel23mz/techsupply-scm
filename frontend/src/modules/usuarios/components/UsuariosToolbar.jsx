import {
  Button,
  Combobox,
  SearchField,
} from '../../../shared/ui';

import {
  USER_ROLE_OPTIONS,
} from '../usuario.utils';

function UsuariosToolbar({
  filteredCount,
  hasFilters,
  onClearFilters,
  onRoleChange,
  onSearchChange,
  roleFilter,
  searchTerm,
  totalCount,
}) {
  const roleOptions = [
    {
      value: 'TODOS',
      label: 'Todos los roles',
      icon: 'bi bi-people',
    },
    ...USER_ROLE_OPTIONS,
  ];

  return (
    <div className="users-toolbar">
      <div className="users-toolbar__filters">
        <SearchField
          className="users-search"
          value={searchTerm}
          placeholder="Buscar nombre, apellido o correo"
          aria-label="Buscar usuarios"
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          onClear={() => onSearchChange('')}
        />

        <Combobox
          className="users-role-filter"
          value={roleFilter}
          options={roleOptions}
          placeholder="Todos los roles"
          searchPlaceholder="Buscar rol..."
          onChange={onRoleChange}
        />
      </div>

      <div className="users-toolbar__meta">
        {hasFilters && (
          <Button
            size="sm"
            tone="secondary"
            icon="bi bi-eraser"
            onClick={onClearFilters}
          >
            Limpiar
          </Button>
        )}

        <p className="users-toolbar__summary" aria-live="polite">
          <strong>{filteredCount}</strong>
          {filteredCount === 1 ? ' usuario' : ' usuarios'}
          {hasFilters && (
            <span> de {totalCount}</span>
          )}
        </p>
      </div>
    </div>
  );
}

export default UsuariosToolbar;
