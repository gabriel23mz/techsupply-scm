function UbicacionesMetrics({ ubicaciones }) {
  const total = ubicaciones.length;
  const conCoordenadas = ubicaciones.filter(
    (item) =>
      Number.isFinite(Number(item.latitud)) &&
      Number.isFinite(Number(item.longitud)),
  ).length;
  const sinCoordenadas = total - conCoordenadas;
  const activas = ubicaciones.filter(
    (item) => item.estado !== false,
  ).length;

  const metrics = [
    {
      title: 'Ubicaciones registradas',
      value: total,
      helper: 'Nodos disponibles',
      icon: 'bi-geo-alt',
      variant: 'primary',
    },
    {
      title: 'Ubicaciones activas',
      value: activas,
      helper: 'Disponibles para operar',
      icon: 'bi-check-circle',
      variant: 'success',
    },
    {
      title: 'Con coordenadas',
      value: conCoordenadas,
      helper: 'Listas para mapas',
      icon: 'bi-crosshair',
      variant: 'info',
    },
    {
      title: 'Sin coordenadas',
      value: sinCoordenadas,
      helper: 'Requieren revisión',
      icon: 'bi-exclamation-circle',
      variant: 'warning',
    },
  ];

  return (
    <section className="locations-metrics">
      {metrics.map((metric) => (
        <article key={metric.title} className="locations-metric-card">
          <div className={`locations-metric-icon ${metric.variant}`}>
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

export default UbicacionesMetrics;
