import Button from '../../ui/Button/Button';
import {
  classNames,
} from '../../ui/internal/classNames';

import './MapFeedback.css';

function MapErrorState({
  actionLabel,
  description = 'No fue posible cargar el mapa.',
  icon = 'bi-exclamation-triangle',
  onAction,
  overlay = false,
  title = 'Mapa no disponible',
  tone = 'danger',
}) {
  return (
    <div
      className={classNames(
        'map-feedback',
        `map-feedback--${tone}`,
        {
          'map-feedback--overlay': overlay,
        },
      )}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <span
        className="map-feedback__icon"
        aria-hidden="true"
      >
        <i className={`bi ${icon}`} />
      </span>

      <div className="map-feedback__content">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      {onAction && actionLabel && (
        <Button
          size="sm"
          tone="secondary"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default MapErrorState;
