import {
  DataTable,
  StatusBadge,
} from '../../../shared/ui';

function formatJourneyCode(jornada) {
  return jornada.codigo ?? `JR-${String(jornada.id).padStart(5, '0')}`;
}

function formatDistance(value) {
  const distance = Number(value);

  return Number.isFinite(distance)
    ? `${new Intl.NumberFormat('es-EC', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(distance)} km`
    : '0,00 km';
}

function formatDuration(value) {
  const minutes = Number(value);

  if (!Number.isFinite(minutes) || minutes <= 0) return '0 min';

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return hours
    ? `${hours} h${remainder ? ` ${remainder} min` : ''}`
    : `${remainder} min`;
}

function formatDate(value) {
  if (!value) return 'Sin fecha';

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? 'Sin fecha'
    : new Intl.DateTimeFormat('es-EC').format(date);
}

function JourneyStatus({ status }) {
  const config = {
    PLANIFICADA: ['Planificada', 'info', 'bi bi-calendar2-check'],
    EN_RUTA: ['En ruta', 'warning', 'bi bi-truck'],
    FINALIZADA: ['Finalizada', 'success', 'bi bi-check2-circle'],
    CANCELADA: ['Cancelada', 'danger', 'bi bi-x-circle'],
  }[status] ?? [String(status ?? 'Sin estado').replaceAll('_', ' '), 'neutral', 'bi bi-circle'];

  return (
    <StatusBadge tone={config[1]} icon={config[2]} dot={false}>
      {config[0]}
    </StatusBadge>
  );
}

function JornadasTable({
  canRecalculate,
  error,
  jornadas,
  loading,
  onRecalculate,
  onRetry,
  onView,
  recalculatingId,
}) {
  const columns = [
    {
      id: 'jornada',
      header: 'Jornada',
      width: '15%',
      cell: (jornada) => (
        <div className="journeys-primary-cell">
          <strong>{formatJourneyCode(jornada)}</strong>
          <span>Punto actual: {jornada.posicion_actual_orden ?? 0}</span>
        </div>
      ),
    },
    {
      id: 'camion',
      header: 'Camión',
      width: '17%',
      cell: (jornada) => (
        <div className="journeys-primary-cell">
          <strong>{jornada.camion?.codigo ?? 'No disponible'}</strong>
          <span>{jornada.camion?.placa ?? 'Sin placa'}</span>
        </div>
      ),
    },
    {
      id: 'fecha',
      header: 'Fecha',
      width: '12%',
      cell: (jornada) => formatDate(jornada.fecha),
    },
    {
      id: 'pedidos',
      header: 'Pedidos',
      width: '12%',
      cell: (jornada) => (
        <div className="journeys-primary-cell">
          <strong>{jornada.resumen?.total_despachos ?? 0}</strong>
          <span>{jornada.resumen?.total_puntos ?? 0} puntos</span>
        </div>
      ),
    },
    {
      id: 'recorrido',
      header: 'Recorrido',
      width: '19%',
      cell: (jornada) => (
        <div className="journeys-primary-cell">
          <strong>{formatDistance(jornada.distancia_total)}</strong>
          <span>{formatDuration(jornada.tiempo_estimado)}</span>
        </div>
      ),
    },
    {
      id: 'estado',
      header: 'Estado',
      width: '15%',
      cell: (jornada) => <JourneyStatus status={jornada.estado} />,
    },
  ];

  return (
    <DataTable
      className="journeys-table"
      caption="Jornadas de reparto registradas"
      columns={columns}
      rows={jornadas}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No existen jornadas de reparto"
      emptyMessage="Genera una planificación para asignar pedidos a los camiones disponibles."
      actions={(jornada) => [
        {
          id: 'view',
          icon: 'bi bi-eye',
          label: 'Ver jornada',
          onClick: () => onView(jornada),
        },
        {
          id: 'edit',
          icon: recalculatingId === jornada.id
            ? 'bi bi-hourglass-split'
            : 'bi bi-arrow-repeat',
          label: 'Recalcular jornada',
          visible: canRecalculate && jornada.estado === 'PLANIFICADA',
          disabled: Boolean(recalculatingId),
          tone: 'primary',
          onClick: () => onRecalculate(jornada),
        },
      ]}
    />
  );
}

export default JornadasTable;
