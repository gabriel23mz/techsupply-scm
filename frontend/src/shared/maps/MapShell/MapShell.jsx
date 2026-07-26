import {
  classNames,
} from '../../ui/internal/classNames';

import MapErrorState from '../MapFeedback/MapErrorState';
import MapLoadingState from '../MapFeedback/MapLoadingState';

import './MapShell.css';

function MapShell({
  ariaLabel = 'Mapa interactivo',
  children,
  className,
  empty = false,
  emptyDescription = 'No existen coordenadas válidas para mostrar.',
  emptyIcon = 'bi-map',
  emptyTitle = 'Mapa no disponible',
  error = null,
  loading = false,
  loadingLabel = 'Cargando mapa...',
}) {
  const visibleError = error
    ? String(error?.message ?? error)
    : null;

  return (
    <section
      className={classNames(
        'map-shell',
        className,
      )}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
    >
      <div className="map-shell__viewport">
        {children}
      </div>

      {loading && (
        <MapLoadingState
          label={loadingLabel}
          overlay
        />
      )}

      {!loading && visibleError && (
        <MapErrorState
          description={visibleError}
          overlay
        />
      )}

      {!loading && !visibleError && empty && (
        <MapErrorState
          description={emptyDescription}
          icon={emptyIcon}
          title={emptyTitle}
          tone="neutral"
          overlay
        />
      )}
    </section>
  );
}

export default MapShell;
