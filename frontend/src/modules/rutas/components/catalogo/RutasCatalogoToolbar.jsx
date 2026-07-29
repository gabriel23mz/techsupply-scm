import {
  Button,
  Combobox,
  SearchField,
} from '../../../../shared/ui';

function RutasCatalogoToolbar({
  destinationFilter,
  hasFilters,
  onClear,
  onDestinationChange,
  onOriginChange,
  onSearchChange,
  originFilter,
  searchTerm,
  ubicaciones,
}) {
  const locationOptions = ubicaciones.map((ubicacion) => ({
    value: ubicacion.id,
    label: ubicacion.nombre,
    icon: 'bi bi-geo-alt',
  }));

  return (
    <div className="routes-catalog-toolbar">
      <SearchField
        className="routes-catalog-search"
        value={searchTerm}
        placeholder="Buscar ruta, origen o destino"
        aria-label="Buscar rutas"
        onChange={(event) => onSearchChange(event.target.value)}
        onClear={() => onSearchChange('')}
      />
      <Combobox
        value={originFilter}
        options={[
          { value: 'TODOS', label: 'Todos los orígenes' },
          ...locationOptions,
        ]}
        placeholder="Todos los orígenes"
        searchPlaceholder="Buscar origen"
        ariaLabel="Filtrar por origen"
        onChange={onOriginChange}
      />
      <Combobox
        value={destinationFilter}
        options={[
          { value: 'TODOS', label: 'Todos los destinos' },
          ...locationOptions,
        ]}
        placeholder="Todos los destinos"
        searchPlaceholder="Buscar destino"
        ariaLabel="Filtrar por destino"
        onChange={onDestinationChange}
      />
      {hasFilters && (
        <Button
          size="sm"
          tone="secondary"
          icon="bi bi-eraser"
          onClick={onClear}
        >
          Limpiar
        </Button>
      )}
    </div>
  );
}

export default RutasCatalogoToolbar;
