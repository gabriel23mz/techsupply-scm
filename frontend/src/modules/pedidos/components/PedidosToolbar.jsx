import Can from '../../../shared/components/Can';

import {
  PERMISSIONS,
} from '../../../shared/constants/permissions';

import {
  Button,
  SearchField,
  SelectField,
} from '../../../shared/ui';

const STATUS_OPTIONS = [
  { value: 'TODOS', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'PREPARANDO', label: 'Preparando' },
  { value: 'LISTO_PARA_DESPACHO', label: 'Listo para despacho' },
  { value: 'DESPACHADO', label: 'Despachado' },
  { value: 'ENTREGADO', label: 'Entregado' },
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'REPROGRAMADO', label: 'Reprogramado' },
];

const DATE_OPTIONS = [
  { value: 'TODAS', label: 'Todas las fechas' },
  { value: 'HOY', label: 'Hoy' },
  { value: 'SEMANA', label: 'Esta semana' },
  { value: 'MES', label: 'Este mes' },
];

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
        <SearchField
          className="pedidos-search"
          value={searchTerm}
          placeholder="Buscar pedido, cliente o responsable..."
          aria-label="Buscar pedidos"
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          onClear={() => onSearchChange('')}
        />

        <SelectField
          value={statusFilter}
          options={STATUS_OPTIONS}
          ariaLabel="Filtrar pedidos por estado"
          onChange={onStatusChange}
        />

        <SelectField
          value={dateFilter}
          options={DATE_OPTIONS}
          ariaLabel="Filtrar pedidos por fecha"
          onChange={onDateChange}
        />

        <Button
          tone="secondary"
          icon="bi bi-eraser"
          onClick={onClear}
        >
          Limpiar
        </Button>
      </div>

      <Can permission={PERMISSIONS.PEDIDOS_CREAR}>
        <Button
          icon="bi bi-plus-lg"
          onClick={onCreate}
        >
          Nuevo pedido
        </Button>
      </Can>
    </section>
  );
}

export default PedidosToolbar;
