import L from 'leaflet';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function createMapMarker({
  className = '',
  icon = 'bi-geo-alt-fill',
  label = '',
  size = 36,
  tone = 'primary',
}) {
  const safeLabel = escapeHtml(label);

  return L.divIcon({
    className: 'map-marker-div-icon',
    html: `
      <div
        class="map-marker map-marker--${escapeHtml(tone)} ${escapeHtml(className)}"
        ${safeLabel ? `aria-label="${safeLabel}"` : ''}
      >
        <i class="bi ${escapeHtml(icon)}"></i>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}
