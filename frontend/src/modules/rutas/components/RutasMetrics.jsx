function RutasMetrics({ metrics }) {
  return (
    <section className="routes-metrics">
      {metrics.map((metric) => (
        <article
          key={metric.title}
          className="routes-metric-card"
        >
          <div
            className={`routes-metric-icon ${metric.variant}`}
          >
            <i className={`bi ${metric.icon}`} />
          </div>

          <div className="routes-metric-content">
            <span>{metric.title}</span>

            <strong>{metric.value}</strong>

            {metric.helper && (
              <small>{metric.helper}</small>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

export default RutasMetrics;

