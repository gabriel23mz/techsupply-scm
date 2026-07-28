import {
  getPreparationProgress,
} from '../bodega.utils';

function PreparationProgress({ compact = false, pedido }) {
  const progress = getPreparationProgress(pedido);

  return (
    <div
      className={[
        'warehouse-progress',
        compact ? 'warehouse-progress--compact' : '',
      ].filter(Boolean).join(' ')}
      aria-label={`Preparación ${progress.percentage}%`}
    >
      <div className="warehouse-progress__summary">
        <span>
          {progress.prepared} de {progress.requested} unidades
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
          {progress.pending > 0
            ? `${progress.pending} unidades pendientes`
            : 'Preparación física completa'}
        </small>
      )}
    </div>
  );
}

export default PreparationProgress;
