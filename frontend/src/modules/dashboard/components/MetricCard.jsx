import StatCard from '../../../shared/ui/StatCard/StatCard';

function MetricCard({
  title,
  value,
  description,
  icon,
  variant = 'primary',
  onClick,
}) {
  return (
    <StatCard
      label={title}
      value={value}
      helper={description}
      icon={`bi ${icon}`}
      tone={variant}
      onClick={onClick}
    />
  );
}

export default MetricCard;
