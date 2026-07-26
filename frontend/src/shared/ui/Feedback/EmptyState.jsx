import FeedbackState from './FeedbackState';

function EmptyState({
  actionLabel,
  children = 'Todavía no existen registros para mostrar.',
  icon = 'bi bi-inbox',
  onAction,
  title = 'Sin resultados',
  ...props
}) {
  return (
    <FeedbackState
      icon={icon}
      title={title}
      actionLabel={actionLabel}
      onAction={onAction}
      {...props}
    >
      {children}
    </FeedbackState>
  );
}

export default EmptyState;
