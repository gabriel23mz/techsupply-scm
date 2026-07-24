function getLocation(cliente) {
  return cliente?.ubicacion ?? null;
}

function ClientesMetrics({ clientes }) {
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

  const conCorreo = clientes.filter(
    (cliente) =>
      String(cliente.correo ?? '').trim(),
  ).length;

  const metrics = [
    {
      title: 'Clientes registrados',
      value: total,
      helper: 'Directorio disponible',
      icon: 'bi-people',
      variant: 'primary',
    },
    {
      title: 'Clientes activos',
      value: activos,
      helper: 'Disponibles para pedidos',
      icon: 'bi-person-check',
      variant: 'success',
    },
    {
      title: 'Ubicaciones con clientes',
      value: ubicacionesConClientes,
      helper: 'Cobertura comercial',
      icon: 'bi-geo-alt',
      variant: 'warning',
    },
    {
      title: 'Clientes con correo',
      value: conCorreo,
      helper:
        total > 0
          ? `${Math.round((conCorreo / total) * 100)}% del total`
          : 'Sin registros',
      icon: 'bi-envelope-check',
      variant: 'info',
    },
  ];

  return (
    <section className="clients-metrics">
      {metrics.map((metric) => (
        <article
          key={metric.title}
          className="clients-metric-card"
        >
          <div
            className={`clients-metric-icon ${metric.variant}`}
          >
            <i className={`bi ${metric.icon}`} />
          </div>

          <div>
            <span>{metric.title}</span>
            <strong>{metric.value}</strong>
            <small>{metric.helper}</small>
          </div>
        </article>
      ))}
    </section>
  );
}

export default ClientesMetrics;
