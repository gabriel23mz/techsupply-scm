import {
  classNames,
} from '../../ui/internal/classNames';

import './MapFeedback.css';

function MapLoadingState({
  label = 'Cargando mapa...',
  overlay = false,
}) {
  return (
    <div
      className={classNames(
        'map-feedback',
        'map-feedback--loading',
        {
          'map-feedback--overlay': overlay,
        },
      )}
      role="status"
      aria-live="polite"
    >
      <span
        className="map-feedback__spinner"
        aria-hidden="true"
      />

      <span>{label}</span>
    </div>
  );
}

export default MapLoadingState;
