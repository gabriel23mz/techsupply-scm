function MetricCard({
  title,
  value,
  description,
  icon,
  variant = 'primary',
  onClick,
}) {
  const Component = onClick
    ? 'button'
    : 'article';

  return (
    <Component
      type={
        onClick
          ? 'button'
          : undefined
      }
      className={`dashboard-metric-card ${
        onClick
          ? 'clickable'
          : ''
      }`}
      onClick={onClick}
    >
      <div
        className={`dashboard-metric-icon ${variant}`}
      >
        <i className={`bi ${icon}`} />
      </div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>

      {onClick && (
        <i className="bi bi-arrow-up-right dashboard-metric-link" />
      )}
    </Component>
  );
}

export default MetricCard;
