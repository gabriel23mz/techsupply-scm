export function hasValidRouteCoordinates(ubicacion) {
  const latitude = ubicacion?.latitud;
  const longitude = ubicacion?.longitud;

  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined ||
    (typeof latitude === 'string' && !latitude.trim()) ||
    (typeof longitude === 'string' && !longitude.trim())
  ) {
    return false;
  }

  return Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude));
}
