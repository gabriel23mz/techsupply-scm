import FeedbackState from './FeedbackState';

function ErrorState({
  actionLabel = 'Reintentar',
  children = 'No fue posible cargar esta sección.',
  icon = 'bi bi-exclamation-octagon',
  onAction,
  title = 'Ocurrió un problema',
  ...props
}) {
  return (
    <FeedbackState
      icon={icon}
      title={title}
      tone="danger"
      actionLabel={onAction ? actionLabel : undefined}
      onAction={onAction}
      {...props}
    >
      {children}
    </FeedbackState>
  );
}

export default ErrorState;
