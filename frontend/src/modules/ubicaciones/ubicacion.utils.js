export const LOCATION_PAGE_SIZE = 10;

export function normalizeLocationText(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('es');
}

export function normalizeLocationPage(value) {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function getLocationPosition(ubicacion) {
  const latitud = Number(ubicacion?.latitud);
  const longitud = Number(ubicacion?.longitud);

  if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
    return null;
  }

  return [latitud, longitud];
}

export function formatCoordinate(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(6) : 'Sin coordenada';
}
