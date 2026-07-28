import {
  getLoadProgress,
} from '../bodega.utils';

function LoadProgress({ compact = false, jornada }) {
  const progress = getLoadProgress(jornada);

  return (
    <div
      className={
        compact
          ? 'warehouse-progress warehouse-progress--compact'
          : 'warehouse-progress'
      }
      aria-label={`Carga completada al ${progress.percentage}%`}
    >
      <div className="warehouse-progress__summary">
        <span>
          {progress.loaded} de {progress.total} despachos
        </span>
        <strong>{progress.percentage}%</strong>
      </div>

      <div
        className="warehouse-progress__track"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={progress.percentage}
      >
        <span style={{ width: `${progress.percentage}%` }} />
      </div>

      {!compact && (
        <small>
          {progress.confirmed
            ? 'Carga confirmada para la jornada.'
            : progress.pending > 0
              ? `${progress.pending} despachos pendientes`
              : 'Todos los despachos están cargados.'}
        </small>
      )}
    </div>
  );
}

export default LoadProgress;
