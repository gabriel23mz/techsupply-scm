import Can from '../../../../shared/components/Can';

import {
  PERMISSIONS,
} from '../../../../shared/constants/permissions';

import {
  Button,
  Combobox,
  SearchField,
} from '../../../../shared/ui';

function RutasCatalogoToolbar({
  searchTerm,
  originFilter,
  destinationFilter,
  ubicaciones,
  onSearchChange,
  onOriginChange,
  onDestinationChange,
  onClear,
  onCreate,
}) {
  const hasFilters =
    Boolean(searchTerm.trim()) ||
    originFilter !== 'todos' ||
    destinationFilter !== 'todos';
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
        placeholder="Buscar origen, destino o distancia..."
        aria-label="Buscar rutas"
        onChange={(event) =>
          onSearchChange(event.target.value)
        }
        onClear={() => onSearchChange('')}
      />

      <Combobox
        value={originFilter}
        options={[
          { value: 'todos', label: 'Todos los orígenes' },
          ...locationOptions,
        ]}
        placeholder="Todos los orígenes"
        searchPlaceholder="Buscar origen..."
        ariaLabel="Filtrar por origen"
        onChange={onOriginChange}
      />

      <Combobox
        value={destinationFilter}
        options={[
          { value: 'todos', label: 'Todos los destinos' },
          ...locationOptions,
        ]}
        placeholder="Todos los destinos"
        searchPlaceholder="Buscar destino..."
        ariaLabel="Filtrar por destino"
        onChange={onDestinationChange}
      />

      <Button
        tone="secondary"
        icon="bi bi-eraser"
        disabled={!hasFilters}
        onClick={onClear}
      >
        Limpiar
      </Button>

      <Can permission={PERMISSIONS.RUTAS_GESTIONAR}>
        <Button
          icon="bi bi-plus-lg"
          onClick={onCreate}
        >
          Nueva ruta
        </Button>
      </Can>
    </div>
  );
}

export default RutasCatalogoToolbar;
