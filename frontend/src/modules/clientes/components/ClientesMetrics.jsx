import {
  StatCard,
} from '../../../shared/ui';

function getLocation(cliente) {
  return cliente?.ubicacion ?? null;
}

function ClientesMetrics({ clientes, loading = false }) {
  const total = clientes.length;

  const activos = clientes.filter(
    (cliente) => cliente.estado !== false,
  ).length;

  const ubicacionesConClientes = new Set(
    clientes
      .map((cliente) => {
        const ubicacion = getLocation(cliente);

        return (
          ubicacion?.id ??
          cliente?.ubicacion_id ??
          null
        );
      })
      .filter(Boolean),
  ).size;

  const metrics = [
    {
      label: 'Clientes registrados',
      value: total,
      helper: 'Directorio comercial',
      icon: 'bi bi-people',
      tone: 'primary',
    },
    {
      label: 'Clientes activos',
      value: activos,
      helper: 'Disponibles para nuevos pedidos',
      icon: 'bi bi-person-check',
      tone: 'success',
    },
    {
      label: 'Cobertura geográfica',
      value: ubicacionesConClientes,
      helper: 'Ubicaciones con clientes asociados',
      icon: 'bi bi-geo-alt',
      tone: 'info',
    },
  ];

  return (
    <section
      className="clients-metrics"
      aria-label="Resumen de clientes"
    >
      {metrics.map((metric) => (
        <StatCard
          key={metric.label}
          {...metric}
          loading={loading}
        />
      ))}
    </section>
  );
}

export default ClientesMetrics;
