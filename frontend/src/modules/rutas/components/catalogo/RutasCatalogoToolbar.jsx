import Can from '../../../../shared/components/Can';

import {
  PERMISSIONS,
} from '../../../../shared/constants/permissions';

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

  return (
    <div className="routes-catalog-toolbar">
      <div className="routes-catalog-search">
        <i className="bi bi-search" />

        <input
          type="search"
          className="form-control"
          value={searchTerm}
          placeholder="Buscar origen, destino o distancia..."
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
        />

        {searchTerm && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => onSearchChange('')}
          >
            <i className="bi bi-x-lg" />
          </button>
        )}
      </div>

      <select
        className="form-select"
        value={originFilter}
        onChange={(event) =>
          onOriginChange(event.target.value)
        }
      >
        <option value="todos">
          Todos los orígenes
        </option>

        {ubicaciones.map((ubicacion) => (
          <option
            key={ubicacion.id}
            value={ubicacion.id}
          >
            {ubicacion.nombre}
          </option>
        ))}
      </select>

      <select
        className="form-select"
        value={destinationFilter}
        onChange={(event) =>
          onDestinationChange(event.target.value)
        }
      >
        <option value="todos">
          Todos los destinos
        </option>

        {ubicaciones.map((ubicacion) => (
          <option
            key={ubicacion.id}
            value={ubicacion.id}
          >
            {ubicacion.nombre}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="btn btn-outline-secondary routes-clear-button"
        disabled={!hasFilters}
        onClick={onClear}
      >
        <i className="bi bi-eraser me-2" />
        Limpiar
      </button>

      <Can permission={PERMISSIONS.RUTAS_GESTIONAR}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onCreate}
        >
          <i className="bi bi-plus-lg me-2" />
          Nueva ruta
        </button>
      </Can>
    </div>
  );
}

export default RutasCatalogoToolbar;
