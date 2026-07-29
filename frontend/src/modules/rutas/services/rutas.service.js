import axios from 'axios';

import api from '../../../shared/services/api';

const routingApi = axios.create({
  baseURL:
    import.meta.env.VITE_ROUTING_API_URL ??
    'https://router.project-osrm.org',
  timeout: 20000,
});

/* ==========================================================================
   Catálogo de rutas
   ========================================================================== */

export const obtenerRutas = async () => {
  const { data } = await api.get('/rutas');

  return data.data;
};

export const obtenerRuta = async (id) => {
  const { data } = await api.get(
    `/rutas/${id}`,
  );

  return data.data;
};

export const crearRuta = async (payload) => {
  const { data } = await api.post(
    '/rutas',
    payload,
  );

  return data.data;
};

export const actualizarRuta = async (
  id,
  payload,
) => {
  const { data } = await api.put(
    `/rutas/${id}`,
    payload,
  );

  return data.data;
};

export const desactivarRuta = async (id) => {
  const { data } = await api.delete(
    `/rutas/${id}`,
  );

  return data.data;
};


/* ==========================================================================
   Cálculo vial automático
   ========================================================================== */

export function normalizeRouteCoordinate(value, label) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && !value.trim())
  ) {
    throw new Error(
      `La ubicación seleccionada no tiene una ${label} válida.`,
    );
  }

  const coordinate = Number(value);

  if (!Number.isFinite(coordinate)) {
    throw new Error(
      `La ubicación seleccionada no tiene una ${label} válida.`,
    );
  }

  return coordinate;
}

export const calcularDistanciaVial = async ({
  origen,
  destino,
  signal,
}) => {
  if (!origen || !destino) {
    throw new Error(
      'Selecciona un origen y un destino.',
    );
  }

  const origenLatitud = normalizeRouteCoordinate(
    origen.latitud,
    'latitud',
  );

  const origenLongitud = normalizeRouteCoordinate(
    origen.longitud,
    'longitud',
  );

  const destinoLatitud = normalizeRouteCoordinate(
    destino.latitud,
    'latitud',
  );

  const destinoLongitud = normalizeRouteCoordinate(
    destino.longitud,
    'longitud',
  );

  const coordinates =
    `${origenLongitud},${origenLatitud};` +
    `${destinoLongitud},${destinoLatitud}`;

  let data;

  try {
    const response = await routingApi.get(
      `/route/v1/driving/${coordinates}`,
      {
        params: {
          alternatives: false,
          overview: false,
          steps: false,
        },
        signal,
      },
    );

    data = response.data;
  } catch (error) {
    if (error?.code === 'ERR_CANCELED' || signal?.aborted) {
      throw error;
    }

    const networkMessage = !error?.response && error?.request
      ? 'No fue posible conectar con el servicio vial. Reintenta o usa el ingreso manual.'
      : '';

    const normalizedError = new Error(
      error?.response?.data?.message ||
      networkMessage ||
      error?.message ||
      'No fue posible consultar el servicio de rutas.',
    );

    normalizedError.cause = error;
    throw normalizedError;
  }

  const route = data?.routes?.[0];

  if (
    data?.code !== 'Ok' ||
    !route ||
    !Number.isFinite(Number(route.distance))
  ) {
    throw new Error(
      'No fue posible calcular una ruta vial entre las ubicaciones seleccionadas.',
    );
  }

  return {
    distancia_km: Number(
      (Number(route.distance) / 1000).toFixed(2),
    ),
    tiempo_estimado_min: Math.max(
      1,
      Math.round(Number(route.duration) / 60),
    ),
  };
};

/* ==========================================================================
   Ubicaciones para formularios de rutas
   ========================================================================== */

export const obtenerUbicaciones = async () => {
  const { data } = await api.get('/ubicaciones');

  return data.data;
};

/* ==========================================================================
   Exportación agrupada
   ========================================================================== */

const rutasService = {
  obtenerRutas,
  obtenerRuta,
  crearRuta,
  actualizarRuta,
  desactivarRuta,
  calcularDistanciaVial,

  obtenerUbicaciones,

};

export default rutasService;

