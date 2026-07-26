import {
  useEffect,
} from 'react';

import L from 'leaflet';
import {
  useMap,
} from 'react-leaflet';

import {
  normalizeMapPositions,
} from '../mapUtils';

function MapViewportController({
  animate = true,
  duration = 0.65,
  focusPositions = [],
  maxZoom = 14,
  padding = 36,
  positions = [],
  requestKey = 0,
  singleZoom = 13,
}) {
  const map = useMap();

  useEffect(() => {
    const normalizedFocus = normalizeMapPositions(
      focusPositions,
    );
    const normalizedPositions = normalizeMapPositions(
      positions,
    );
    const targetPositions = normalizedFocus.length
      ? normalizedFocus
      : normalizedPositions;

    map.invalidateSize();

    if (!targetPositions.length) {
      return;
    }

    if (targetPositions.length === 1) {
      map.flyTo(
        targetPositions[0],
        singleZoom,
        {
          animate,
          duration,
        },
      );

      return;
    }

    const resolvedPadding = Array.isArray(padding)
      ? padding
      : [padding, padding];

    map.flyToBounds(
      L.latLngBounds(targetPositions),
      {
        animate,
        duration,
        maxZoom,
        padding: resolvedPadding,
      },
    );
  }, [
    animate,
    duration,
    focusPositions,
    map,
    maxZoom,
    padding,
    positions,
    requestKey,
    singleZoom,
  ]);

  return null;
}

export default MapViewportController;
