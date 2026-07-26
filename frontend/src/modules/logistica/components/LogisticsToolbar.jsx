import Can from '../../../shared/components/Can';

import {
  PERMISSIONS,
} from '../../../shared/constants/permissions';

import {
  Button,
  SearchField,
  SelectField,
} from '../../../shared/ui';

const JOURNEY_STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'PLANIFICADA', label: 'Planificada' },
  { value: 'EN_RUTA', label: 'En ruta' },
  { value: 'FINALIZADA', label: 'Finalizada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

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
      <SearchField
        className="logistics-search-box"
        value={searchTerm}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        onChange={(event) =>
          onSearchChange(event.target.value)
        }
        onClear={() => onSearchChange('')}
      />

      {!isOrdersTab && (
        <SelectField
          value={statusFilter}
          options={JOURNEY_STATUS_OPTIONS}
          ariaLabel="Filtrar jornadas por estado"
          onChange={onStatusChange}
        />
      )}

      <Button
        tone="secondary"
        icon="bi bi-eraser"
        disabled={!hasFilters}
        onClick={onClear}
      >
        Limpiar
      </Button>

      {isOrdersTab && (
        <Can permission={PERMISSIONS.JORNADAS_GENERAR}>
          <Button
            icon="bi bi-stars"
            loading={isGenerating}
            loadingLabel="Planificando..."
            disabled={generateDisabled}
            onClick={onGenerate}
            title={
              availableOrdersCount === 0
                ? 'No existen pedidos disponibles para planificar'
                : 'Generar jornadas de reparto'
            }
          >
            Generar jornadas ({availableOrdersCount})
          </Button>
        </Can>
      )}
    </section>
  );
}

export default LogisticsToolbar;
