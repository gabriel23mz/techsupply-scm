function DespachoToolbar({
  searchTerm,
  statusFilter,
  dateFilter,
  isLoading,
  onSearchChange,
  onStatusChange,
  onDateChange,
  onClear,
  onRefresh,
}) {
  return (
    <section className="dispatch-toolbar">
      <div className="dispatch-search">
        <i className="bi bi-search" />

        <input
          type="search"
          className="form-control"
          value={searchTerm}
          placeholder="Buscar despacho, pedido, cliente o jornada..."
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
        <option value="PENDIENTE">
          Pendiente
        </option>
        <option value="EN_TRANSITO">
          En tránsito
        </option>
        <option value="ENTREGADO">
          Entregado
        </option>
        <option value="NO_ENTREGADO">
          No entregado
        </option>
        <option value="CANCELADO">
          Cancelado
        </option>
      </select>

      <select
        className="form-select"
        value={dateFilter}
        onChange={(event) =>
          onDateChange(event.target.value)
        }
      >
        <option value="TODAS">
          Todas las fechas
        </option>
        <option value="HOY">Hoy</option>
        <option value="SEMANA">
          Esta semana
        </option>
        <option value="MES">
          Este mes
        </option>
      </select>

      <button
        type="button"
        className="btn btn-outline-secondary"
        onClick={onClear}
      >
        <i className="bi bi-eraser me-2" />
        Limpiar
      </button>

      <button
        type="button"
        className="btn btn-outline-primary"
        disabled={isLoading}
        onClick={onRefresh}
      >
        {isLoading ? (
          <span className="spinner-border spinner-border-sm me-2" />
        ) : (
          <i className="bi bi-arrow-clockwise me-2" />
        )}
        Actualizar
      </button>
    </section>
  );
}

export default DespachoToolbar;
