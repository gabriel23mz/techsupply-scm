import StatCard from '../../../shared/ui/StatCard/StatCard';

function PedidoMetricCard({
  title,
  value,
  helper,
  icon,
  variant = 'primary',
}) {
  return (
    <StatCard
      label={title}
      value={value}
      helper={helper}
      icon={`bi ${icon}`}
      tone={variant}
    />
  );
}

export default PedidoMetricCard;
