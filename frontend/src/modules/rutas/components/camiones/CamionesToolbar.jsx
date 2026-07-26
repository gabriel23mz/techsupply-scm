import {
  Button,
  SearchField,
  SelectField,
} from '../../../../shared/ui';

const STATUS_OPTIONS = [
  { value: 'TODOS', label: 'Todos los estados' },
  { value: 'EN_BODEGA', label: 'En bodega' },
  { value: 'EN_RUTA', label: 'En ruta' },
  { value: 'INACTIVO', label: 'Inactivo' },
];

const CAPACITY_OPTIONS = [
  { value: 'TODOS', label: 'Toda capacidad' },
  { value: 'DISPONIBLE', label: 'Con capacidad disponible' },
  { value: 'COMPLETA', label: 'Capacidad completa' },
];

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
      <SearchField
        className="routes-trucks-search"
        value={searchTerm}
        placeholder="Buscar camión, placa o jornada..."
        aria-label="Buscar camiones"
        onChange={(event) =>
          onSearchChange(event.target.value)
        }
        onClear={() => onSearchChange('')}
      />

      <SelectField
        value={statusFilter}
        options={STATUS_OPTIONS}
        ariaLabel="Filtrar camiones por estado"
        onChange={onStatusChange}
      />

      <SelectField
        value={capacityFilter}
        options={CAPACITY_OPTIONS}
        ariaLabel="Filtrar camiones por capacidad"
        onChange={onCapacityChange}
      />

      <Button
        tone="secondary"
        icon="bi bi-eraser"
        disabled={!hasFilters}
        onClick={onClear}
      >
        Limpiar
      </Button>
    </div>
  );
}

export default CamionesToolbar;
