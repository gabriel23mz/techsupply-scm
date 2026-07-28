import {
  Button,
  Combobox,
  SearchField,
} from '../../../shared/ui';

function ClientesToolbar({
  filteredCount,
  hasFilters,
  locationFilter,
  onClearFilters,
  onLocationChange,
  onSearchChange,
  searchTerm,
  totalCount,
  ubicaciones,
}) {
  const locationOptions = [
    {
      value: 'TODAS',
      label: 'Todas las ubicaciones',
      icon: 'bi bi-geo-alt',
    },
    ...ubicaciones.map((ubicacion) => ({
      value: ubicacion.id,
      label: ubicacion.nombre,
      icon: 'bi bi-geo-alt',
    })),
  ];

  return (
    <div className="clients-toolbar">
      <div className="clients-toolbar__filters">
        <SearchField
          className="clients-search"
          value={searchTerm}
          placeholder="Buscar cliente, identificación, correo o teléfono"
          aria-label="Buscar clientes"
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          onClear={() => onSearchChange('')}
        />

        <Combobox
          className="clients-location-filter"
          value={locationFilter}
          options={locationOptions}
          placeholder="Todas las ubicaciones"
          searchPlaceholder="Buscar ubicación..."
          onChange={onLocationChange}
        />

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
      </div>

      <p className="clients-toolbar__summary" aria-live="polite">
        <strong>{filteredCount}</strong>
        {filteredCount === 1 ? ' cliente' : ' clientes'}
        {hasFilters && (
          <span> de {totalCount}</span>
        )}
      </p>
    </div>
  );
}

export default ClientesToolbar;
