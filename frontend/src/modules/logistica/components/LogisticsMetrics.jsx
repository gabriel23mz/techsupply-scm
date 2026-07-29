import {
  StatCard,
} from '../../../shared/ui';

function LogisticsMetrics({ jornadas, pedidosDisponibles, loading = false }) {
  const planificadas = jornadas.filter(
    (jornada) => jornada.estado === 'PLANIFICADA',
  ).length;
  const enRuta = jornadas.filter(
    (jornada) => jornada.estado === 'EN_RUTA',
  ).length;
  const finalizadas = jornadas.filter(
    (jornada) => jornada.estado === 'FINALIZADA',
  ).length;

  return (
    <section className="journeys-metrics" aria-label="Resumen de jornadas">
      <StatCard
        label="Pedidos listos"
        value={pedidosDisponibles.length}
        helper="Disponibles para planificar"
        icon="bi bi-box-seam"
        loading={loading}
      />
      <StatCard
        label="Planificadas"
        value={planificadas}
        helper="Esperan inicio de ruta"
        icon="bi bi-calendar2-check"
        tone="info"
        loading={loading}
      />
      <StatCard
        label="En ruta"
        value={enRuta}
        helper="Seguimiento operativo"
        icon="bi bi-truck"
        tone="warning"
        loading={loading}
      />
      <StatCard
        label="Finalizadas"
        value={finalizadas}
        helper="Operaciones cerradas"
        icon="bi bi-check2-circle"
        tone="success"
        loading={loading}
      />
    </section>
  );
}

export default LogisticsMetrics;
