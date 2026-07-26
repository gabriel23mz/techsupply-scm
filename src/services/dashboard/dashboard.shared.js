import {
  DASHBOARD_LEVELS,
} from '../../constants/dashboard.js';

export const toPlain = (value) => {
  if (!value) {
    return value;
  }

  return typeof value.toJSON === 'function'
    ? value.toJSON()
    : value;
};

export const metric = ({
  id,
  titulo,
  valor,
  descripcion,
  nivel = DASHBOARD_LEVELS.INFO,
}) => ({
  id,
  titulo,
  valor: Number(valor ?? 0),
  descripcion,
  nivel,
});

export const access = ({
  id,
  titulo,
  descripcion,
}) => ({
  id,
  titulo,
  descripcion,
});

export const notification = ({
  id,
  tipo,
  nivel = DASHBOARD_LEVELS.INFO,
  titulo,
  mensaje,
  entidadId = null,
  accesoId = null,
  creadaEn = null,
}) => ({
  id: String(id),
  tipo,
  nivel,
  titulo,
  mensaje,
  entidad_id: entidadId,
  acceso_id: accesoId,
  creada_en: creadaEn
    ? new Date(creadaEn).toISOString()
    : new Date().toISOString(),
});

export const normalizeLimit = (
  value,
  defaultValue = 8,
  maxValue = 20,
) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return defaultValue;
  }

  return Math.min(parsed, maxValue);
};

export const sortNotifications = (
  items,
  limit,
) => [...items]
  .sort((left, right) => (
    new Date(right.creada_en).getTime() -
    new Date(left.creada_en).getTime()
  ))
  .slice(0, limit);
