import {
  Button,
  Combobox,
  SearchField,
} from '../../../shared/ui';

function DespachoToolbar({
  dateFilter,
  hasFilters,
  onClear,
  onDateChange,
  onSearchChange,
  onStatusChange,
  resultCount = 0,
  searchTerm,
  statusFilter,
}) {
  return (
    <div className="dispatch-toolbar">
      <div className="dispatch-toolbar__filters">
        <SearchField
          className="dispatch-toolbar__search"
          value={searchTerm}
          placeholder="Buscar despacho, pedido, cliente o jornada"
          aria-label="Buscar despachos"
          onChange={(event) => onSearchChange(event.target.value)}
          onClear={() => onSearchChange('')}
        />
        <Combobox
          className="dispatch-toolbar__status"
          value={statusFilter}
          options={[
            { value: 'TODOS', label: 'Todos los estados' },
            { value: 'PENDIENTE', label: 'Pendiente' },
            { value: 'EN_TRANSITO', label: 'En tránsito' },
            { value: 'ENTREGADO', label: 'Entregado' },
            { value: 'NO_ENTREGADO', label: 'No entregado' },
            { value: 'CANCELADO', label: 'Cancelado' },
          ]}
          searchable={false}
          ariaLabel="Filtrar despachos por estado"
          onChange={onStatusChange}
        />
        <Combobox
          className="dispatch-toolbar__date"
          value={dateFilter}
          options={[
            { value: 'TODAS', label: 'Todas las fechas' },
            { value: 'HOY', label: 'Hoy' },
            { value: 'SEMANA', label: 'Esta semana' },
            { value: 'MES', label: 'Este mes' },
          ]}
          searchable={false}
          ariaLabel="Filtrar despachos por fecha"
          onChange={onDateChange}
        />
      </div>

      <div className="dispatch-toolbar__meta">
        {hasFilters && (
          <Button
            className="dispatch-toolbar__clear"
            size="sm"
            tone="secondary"
            icon="bi bi-eraser"
            onClick={onClear}
          >
            Limpiar
          </Button>
        )}

        <p className="dispatch-directory__summary">
          <strong>{resultCount}</strong>{' '}
          {resultCount === 1 ? 'despacho' : 'despachos'}
        </p>
      </div>
    </div>
  );
}

export default DespachoToolbar;
