export function normalizeMapPosition(position) {
  if (Array.isArray(position)) {
    const latitude = Number(position[0]);
    const longitude = Number(position[1]);

    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      return [latitude, longitude];
    }

    return null;
  }

  const latitude = Number(
    position?.latitud ?? position?.latitude,
  );
  const longitude = Number(
    position?.longitud ?? position?.longitude,
  );

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return [latitude, longitude];
}

export function normalizeMapPositions(positions) {
  if (!Array.isArray(positions)) {
    return [];
  }

  return positions
    .map(normalizeMapPosition)
    .filter(Boolean);
}

export function normalizeMapGeometry(geometry) {
  return normalizeMapPositions(geometry);
}
