import './LoadingState.css';

function LoadingState({
  label = 'Cargando información...',
  rows = 3,
}) {
  return (
    <div
      className="ui-loading-state"
      role="status"
      aria-live="polite"
    >
      <span className="ui-loading-state__spinner" />
      <span>{label}</span>
      <div className="ui-loading-state__skeletons">
        {Array.from({ length: rows }, (_, index) => (
          <span key={index} />
        ))}
      </div>
    </div>
  );
}

export default LoadingState;
