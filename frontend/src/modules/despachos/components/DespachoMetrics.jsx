function DespachoMetrics({ despachos }) {
  const metrics = [
    {
      title: 'Despachos registrados',
      value: despachos.length,
      helper: 'Historial disponible',
      icon: 'bi-box-seam',
      variant: 'primary',
    },
    {
      title: 'Pendientes',
      value: despachos.filter(
        (item) => item.estado === 'PENDIENTE',
      ).length,
      helper: 'Esperan inicio de ruta',
      icon: 'bi-clock-history',
      variant: 'warning',
    },
    {
      title: 'En tránsito',
      value: despachos.filter(
        (item) => item.estado === 'EN_TRANSITO',
      ).length,
      helper: 'Seguimiento activo',
      icon: 'bi-truck',
      variant: 'info',
    },
    {
      title: 'Cerrados',
      value: despachos.filter(
        (item) =>
          [
            'ENTREGADO',
            'NO_ENTREGADO',
            'CANCELADO',
          ].includes(item.estado),
      ).length,
      helper: 'Entregados o finalizados',
      icon: 'bi-check2-circle',
      variant: 'success',
    },
  ];

  return (
    <section className="dispatch-metrics">
      {metrics.map((metric) => (
        <article
          className="dispatch-metric-card"
          key={metric.title}
        >
          <div
            className={`dispatch-metric-icon ${metric.variant}`}
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

export default DespachoMetrics;
