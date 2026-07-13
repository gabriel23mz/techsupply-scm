function PedidoMetricCard({
  title,
  value,
  helper,
  icon,
  variant = 'primary',
}) {
  return (
    <article className="pedido-metric-card">
      <div
        className={`pedido-metric-icon ${variant}`}
      >
        <i className={`bi ${icon}`} />
      </div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </article>
  );
}

export default PedidoMetricCard;
