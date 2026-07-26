import Can from '../../../shared/components/Can';

import {
  PERMISSIONS,
} from '../../../shared/constants/permissions';

function LogisticsToolbar({
  activeTab,
  searchTerm,
  statusFilter,
  availableOrdersCount = 0,
  isLoading = false,
  isGenerating = false,
  onSearchChange,
  onStatusChange,
  onClear,
  onGenerate,
}) {
  const isOrdersTab = activeTab === 'pedidos';

  const generateDisabled =
    isGenerating ||
    isLoading ||
    availableOrdersCount === 0;

  const hasFilters =
    Boolean(searchTerm.trim()) ||
    (!isOrdersTab && statusFilter !== 'todos');

  const searchPlaceholder = isOrdersTab
    ? 'Buscar pedido, cliente o ubicación...'
    : 'Buscar jornada, camión o placa...';

  return (
    <section className="logistics-toolbar">
      <div className="logistics-search-box">
        <i className="bi bi-search" />

        <input
          type="search"
          className="form-control"
          value={searchTerm}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />

        {searchTerm && (
          <button
            type="button"
            className="logistics-search-clear"
            title="Limpiar búsqueda"
            aria-label="Limpiar búsqueda"
            onClick={() => onSearchChange('')}
          >
            <i className="bi bi-x-lg" />
          </button>
        )}
      </div>

      {!isOrdersTab && (
        <select
          className="form-select"
          value={statusFilter}
          onChange={(event) =>
            onStatusChange(event.target.value)
          }
          aria-label="Filtrar jornadas por estado"
        >
          <option value="todos">
            Todos los estados
          </option>
          <option value="PLANIFICADA">
            Planificada
          </option>
          <option value="EN_RUTA">
            En ruta
          </option>
          <option value="FINALIZADA">
            Finalizada
          </option>
          <option value="CANCELADA">
            Cancelada
          </option>
        </select>
      )}

      <button
        type="button"
        className="btn btn-outline-secondary logistics-clear-button"
        disabled={!hasFilters}
        onClick={onClear}
      >
        <i className="bi bi-eraser me-2" />
        Limpiar
      </button>

      {isOrdersTab && (
        <Can permission={PERMISSIONS.JORNADAS_GENERAR}>
          <button
            type="button"
            className="btn btn-primary logistics-generate-btn"
            disabled={generateDisabled}
            onClick={onGenerate}
            title={
              availableOrdersCount === 0
                ? 'No existen pedidos disponibles para planificar'
                : 'Generar jornadas de reparto'
            }
          >
            {isGenerating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Planificando...
              </>
            ) : (
              <>
                <i className="bi bi-stars me-2" />
                Generar jornadas
                <span className="logistics-generate-count">
                  {availableOrdersCount}
                </span>
              </>
            )}
          </button>
        </Can>
      )}
    </section>
  );
}

export default LogisticsToolbar;
