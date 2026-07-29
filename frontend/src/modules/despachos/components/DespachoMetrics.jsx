import {
  StatCard,
} from '../../../shared/ui';

function DespachoMetrics({ despachos, loading = false }) {
  const pending = despachos.filter(
    (item) => item.estado === 'PENDIENTE',
  ).length;
  const inTransit = despachos.filter(
    (item) => item.estado === 'EN_TRANSITO',
  ).length;
  const closed = despachos.filter((item) => [
    'ENTREGADO',
    'NO_ENTREGADO',
    'CANCELADO',
  ].includes(item.estado)).length;

  return (
    <section className="dispatch-metrics" aria-label="Resumen de despachos">
      <StatCard
        label="Despachos registrados"
        value={despachos.length}
        helper="Historial disponible"
        icon="bi bi-box-seam"
        loading={loading}
      />
      <StatCard
        label="Pendientes"
        value={pending}
        helper="Esperan inicio de ruta"
        icon="bi bi-clock-history"
        tone="warning"
        loading={loading}
      />
      <StatCard
        label="En tránsito"
        value={inTransit}
        helper="Seguimiento activo"
        icon="bi bi-truck"
        tone="info"
        loading={loading}
      />
      <StatCard
        label="Cerrados"
        value={closed}
        helper="Entregados o finalizados"
        icon="bi bi-check2-circle"
        tone="success"
        loading={loading}
      />
    </section>
  );
}

export default DespachoMetrics;
