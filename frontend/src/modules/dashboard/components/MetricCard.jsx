function MetricCard({ title, value, description, icon, variant = 'primary' }) {
  return (
    <article className="metric-card">
      <div>
        <span className="metric-title">{title}</span>
        <strong className="metric-value">{value}</strong>
        <p className={`metric-description ${variant}`}>{description}</p>
      </div>

      <div className={`metric-icon ${variant}`}>
        <i className={`bi ${icon}`} />
      </div>
    </article>
  );
}

export default MetricCard;

