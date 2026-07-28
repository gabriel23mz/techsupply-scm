import {
  useEffect,
  useRef,
} from 'react';

import L from 'leaflet';
import {
  useMap,
} from 'react-leaflet';

import IconButton from '../../ui/IconButton/IconButton';
import {
  classNames,
} from '../../ui/internal/classNames';
import {
  normalizeMapPosition,
  normalizeMapPositions,
} from '../mapUtils';

import './MapControls.css';

function MapControls({
  className,
  defaultCenter,
  defaultZoom = 10,
  fitLabel = 'Ajustar todos los puntos',
  fitPositions = [],
  onRefresh,
  placement = 'top-right',
  refreshLabel = 'Actualizar mapa',
  resetLabel = 'Restablecer vista',
  showFit = true,
  showReset = false,
  showZoom = true,
  singleZoom = 13,
}) {
  const map = useMap();
  const controlsRef = useRef(null);

  useEffect(() => {
    const container = controlsRef.current;
    if (!container) return undefined;

    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    return undefined;
  }, []);

  const handleFit = () => {
    const positions = normalizeMapPositions(
      fitPositions,
    );

    if (!positions.length) {
      return;
    }

    if (positions.length === 1) {
      map.flyTo(positions[0], singleZoom, {
        animate: true,
        duration: 0.55,
      });

      return;
    }

    map.flyToBounds(L.latLngBounds(positions), {
      animate: true,
      duration: 0.55,
      maxZoom: 14,
      padding: [36, 36],
    });
  };

  const handleReset = () => {
    const center = normalizeMapPosition(defaultCenter);

    if (!center) {
      return;
    }

    map.flyTo(center, defaultZoom, {
      animate: true,
      duration: 0.55,
    });
  };

  return (
    <div
      ref={controlsRef}
      className={classNames(
        'map-controls',
        `map-controls--${placement}`,
        className,
      )}
      role="toolbar"
      aria-label="Controles del mapa"
    >
      {showZoom && (
        <div className="map-controls__group">
          <IconButton
            className="map-controls__button"
            icon="bi bi-plus-lg"
            label="Acercar"
            size="sm"
            tone="ghost"
            onClick={() => map.zoomIn()}
          />

          <IconButton
            className="map-controls__button"
            icon="bi bi-dash-lg"
            label="Alejar"
            size="sm"
            tone="ghost"
            onClick={() => map.zoomOut()}
          />
        </div>
      )}

      {(showFit || showReset || onRefresh) && (
        <div className="map-controls__group">
          {showFit && (
            <IconButton
              className="map-controls__button"
              disabled={!normalizeMapPositions(fitPositions).length}
              icon="bi bi-arrows-fullscreen"
              label={fitLabel}
              size="sm"
              tone="ghost"
              onClick={handleFit}
            />
          )}

          {showReset && (
            <IconButton
              className="map-controls__button"
              disabled={!normalizeMapPosition(defaultCenter)}
              icon="bi bi-crosshair"
              label={resetLabel}
              size="sm"
              tone="ghost"
              onClick={handleReset}
            />
          )}

          {onRefresh && (
            <IconButton
              className="map-controls__button"
              icon="bi bi-arrow-clockwise"
              label={refreshLabel}
              size="sm"
              tone="ghost"
              onClick={onRefresh}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default MapControls;
