import {
  Button,
  SearchField,
  SelectField,
} from '../../../shared/ui';

const STATUS_OPTIONS = [
  { value: 'TODOS', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'EN_TRANSITO', label: 'En tránsito' },
  { value: 'ENTREGADO', label: 'Entregado' },
  { value: 'NO_ENTREGADO', label: 'No entregado' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

const DATE_OPTIONS = [
  { value: 'TODAS', label: 'Todas las fechas' },
  { value: 'HOY', label: 'Hoy' },
  { value: 'SEMANA', label: 'Esta semana' },
  { value: 'MES', label: 'Este mes' },
];

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
      <SearchField
        className="dispatch-search"
        value={searchTerm}
        placeholder="Buscar despacho, pedido, cliente o jornada..."
        aria-label="Buscar despachos"
        onChange={(event) =>
          onSearchChange(event.target.value)
        }
        onClear={() => onSearchChange('')}
      />

      <SelectField
        value={statusFilter}
        options={STATUS_OPTIONS}
        ariaLabel="Filtrar por estado"
        onChange={onStatusChange}
      />

      <SelectField
        value={dateFilter}
        options={DATE_OPTIONS}
        ariaLabel="Filtrar por fecha"
        onChange={onDateChange}
      />

      <Button
        tone="secondary"
        icon="bi bi-eraser"
        onClick={onClear}
      >
        Limpiar
      </Button>

      <Button
        tone="outline"
        icon="bi bi-arrow-clockwise"
        loading={isLoading}
        loadingLabel="Actualizando..."
        onClick={onRefresh}
      >
        Actualizar
      </Button>
    </section>
  );
}

export default DespachoToolbar;
