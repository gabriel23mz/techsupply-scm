export function isLicenseExpired(value) {
  if (!value) return true;

  const expiration = new Date(`${String(value).slice(0, 10)}T23:59:59`);

  return Number.isNaN(expiration.getTime()) || expiration < new Date();
}

export function getDriverStatus(chofer) {
  if (!chofer?.activo) return 'INACTIVO';
  if (isLicenseExpired(chofer.fecha_vencimiento_licencia)) {
    return 'LICENCIA_VENCIDA';
  }
  if (Array.isArray(chofer.jornadas) && chofer.jornadas.length > 0) {
    return 'EN_JORNADA';
  }

  return 'DISPONIBLE';
}
