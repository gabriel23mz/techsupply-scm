function LogisticsMetrics({ metrics }) {
  return (
    <section className="logistics-metrics">
      {metrics.map((metric) => (
        <article className="logistics-metric-card" key={metric.title}>
          <div className={`logistics-metric-icon ${metric.variant}`}>
            <i className={`bi ${metric.icon}`} />
          </div>

          <div>
            <span>{metric.title}</span>
            <strong>{metric.value}</strong>
          </div>
        </article>
      ))}
    </section>
  );
}

export default LogisticsMetrics;

