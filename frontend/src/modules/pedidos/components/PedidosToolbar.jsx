import Can from '../../../shared/components/Can';

import {
  PERMISSIONS,
} from '../../../shared/constants/permissions';

function PedidosToolbar({
  searchTerm,
  statusFilter,
  dateFilter,
  onSearchChange,
  onStatusChange,
  onDateChange,
  onClear,
  onCreate,
}) {
  return (
    <section className="pedidos-toolbar">
      <div className="pedidos-filters">
        <div className="pedidos-search">
          <i className="bi bi-search" />

          <input
            type="search"
            className="form-control"
            value={searchTerm}
            placeholder="Buscar pedido, cliente o responsable..."
            onChange={(event) =>
              onSearchChange(
                event.target.value,
              )
            }
          />

          {searchTerm && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() =>
                onSearchChange('')
              }
            >
              <i className="bi bi-x-lg" />
            </button>
          )}
        </div>

        <select
          className="form-select"
          value={statusFilter}
          onChange={(event) =>
            onStatusChange(
              event.target.value,
            )
          }
        >
          <option value="TODOS">
            Todos los estados
          </option>
          <option value="PENDIENTE">
            Pendiente
          </option>
          <option value="PREPARANDO">
            Preparando
          </option>
          <option value="LISTO_PARA_DESPACHO">
            Listo para despacho
          </option>
          <option value="DESPACHADO">
            Despachado
          </option>
          <option value="ENTREGADO">
            Entregado
          </option>
          <option value="CANCELADO">
            Cancelado
          </option>
          <option value="REPROGRAMADO">
            Reprogramado
          </option>
        </select>

        <select
          className="form-select"
          value={dateFilter}
          onChange={(event) =>
            onDateChange(
              event.target.value,
            )
          }
        >
          <option value="TODAS">
            Todas las fechas
          </option>
          <option value="HOY">
            Hoy
          </option>
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
      </div>

      <Can permission={PERMISSIONS.PEDIDOS_CREAR}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onCreate}
        >
          <i className="bi bi-plus-lg me-2" />
          Nuevo pedido
        </button>
      </Can>
    </section>
  );
}

export default PedidosToolbar;
