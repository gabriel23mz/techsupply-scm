function CamionesToolbar({
  searchTerm,
  statusFilter,
  capacityFilter,
  onSearchChange,
  onStatusChange,
  onCapacityChange,
  onClear,
}) {
  const hasFilters =
    Boolean(searchTerm.trim()) ||
    statusFilter !== 'TODOS' ||
    capacityFilter !== 'TODOS';

  return (
    <div className="routes-trucks-toolbar">
      <div className="routes-trucks-search">
        <i className="bi bi-search" />

        <input
          type="search"
          className="form-control"
          value={searchTerm}
          placeholder="Buscar camión, placa o jornada..."
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
        value={statusFilter}
        onChange={(event) =>
          onStatusChange(event.target.value)
        }
      >
        <option value="TODOS">
          Todos los estados
        </option>
        <option value="EN_BODEGA">
          En bodega
        </option>
        <option value="EN_RUTA">
          En ruta
        </option>
        <option value="INACTIVO">
          Inactivo
        </option>
      </select>

      <select
        className="form-select"
        value={capacityFilter}
        onChange={(event) =>
          onCapacityChange(event.target.value)
        }
      >
        <option value="TODOS">
          Toda capacidad
        </option>
        <option value="DISPONIBLE">
          Con capacidad disponible
        </option>
        <option value="COMPLETA">
          Capacidad completa
        </option>
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
    </div>
  );
}

export default CamionesToolbar;
