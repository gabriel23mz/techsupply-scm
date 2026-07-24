/**
 * ---------------------------------------------------------
 * Python Service
 * ---------------------------------------------------------
 *
 * Responsabilidad:
 * Actuar como adaptador entre Node.js y el servicio de
 * cálculo de rutas implementado en Python.
 *
 * Este servicio encapsula completamente la comunicación
 * HTTP con FastAPI, permitiendo que el resto del sistema
 * desconozca los detalles de integración.
 *
 * No conoce:
 *
 * - Sequelize
 * - Express
 * - Pedidos
 * - Clientes
 * - Despachos
 * - Algoritmo A*
 *
 * Únicamente envía el contrato de entrada al servicio
 * Python y devuelve el contrato de salida.
 */

import axios from 'axios';

import {
  ExternalServiceError,
} from '../utils/errors.js';

/**
 * ---------------------------------------------------------
 * Cliente HTTP
 * ---------------------------------------------------------
 *
 * Instancia reutilizable para comunicarse con el servicio
 * de cálculo de rutas.
 */
const pythonApi = axios.create({
  baseURL:
    process.env.PYTHON_API ??
    'http://127.0.0.1:8000',

  /*
   * La planificación logística puede tardar varios
   * segundos debido a:
   * - ACO-CVRP
   * - A*
   * - consultas a OSRM
   * - persistencia de múltiples jornadas
  */

  timeout: Number(
    process.env.PYTHON_TIMEOUT_MS ??
    90000,
  ),
});

const getTimeout = (
  envName,
  defaultValue,
) => Number(
  process.env[envName] ??
  process.env.PYTHON_TIMEOUT_MS ??
  defaultValue,
);

const isFiniteNumber = (value) =>
  typeof value === 'number' &&
  Number.isFinite(value);

const ensure = (
  condition,
  message,
) => {
  if (!condition) {
    throw new ExternalServiceError(
      message,
      'PYTHON_CONTRACT_ERROR',
    );
  }
};

const normalizePythonError = (
  error,
  context,
) => {
  if (
    error.code === 'ECONNABORTED' ||
    error.name === 'CanceledError'
  ) {
    return new ExternalServiceError(
      `${context}: timeout del servicio Python`,
      'PYTHON_TIMEOUT',
      { cause: error },
    );
  }

  if (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNRESET'
  ) {
    return new ExternalServiceError(
      `${context}: no fue posible comunicarse con el servicio Python: ${error.message}`,
      'PYTHON_UNAVAILABLE',
      { cause: error },
    );
  }

  if (error.response) {
    const structuredError =
      error.response.data?.error;

    const code = structuredError?.code ??
      `HTTP_${error.response.status}`;

    const message = structuredError?.message ??
      error.message;

    return new ExternalServiceError(
      `${context}: ${code} - ${message}`,
      'PYTHON_HTTP_ERROR',
      { cause: error },
    );
  }

  return error;
};

const getKnownRouteNodes = (payload) => new Set([
  Number(payload?.origenId),
  Number(payload?.destinoId),
  ...(payload?.rutas ?? []).flatMap((ruta) => [
    Number(ruta.origen),
    Number(ruta.destino),
  ]),
]);

const validateRouteResponse = (
  payload,
  data,
) => {
  ensure(
    data &&
    Array.isArray(data.ruta),
    'El servicio de cálculo de rutas devolvió una respuesta inválida.',
  );

  ensure(
    isFiniteNumber(data.distancia_total) &&
    data.distancia_total >= 0,
    'El servicio de cálculo de rutas devolvió una distancia inválida.',
  );

  ensure(
    isFiniteNumber(data.tiempo_estimado) &&
    data.tiempo_estimado >= 0,
    'El servicio de cálculo de rutas devolvió un tiempo inválido.',
  );

  ensure(
    data.ruta.length > 0,
    'El servicio de cálculo de rutas devolvió una ruta vacía.',
  );

  ensure(
    Number(data.ruta[0]) ===
      Number(payload.origenId),
    'El servicio de cálculo de rutas devolvió una ruta con origen inválido.',
  );

  ensure(
    Number(data.ruta.at(-1)) ===
      Number(payload.destinoId),
    'El servicio de cálculo de rutas devolvió una ruta con destino inválido.',
  );

  const knownNodes = getKnownRouteNodes(
    payload,
  );

  const hasUnknownNode = data.ruta.some(
    (nodeId) =>
      !knownNodes.has(Number(nodeId)),
  );

  ensure(
    !hasUnknownNode,
    'El servicio de cálculo de rutas devolvió nodos desconocidos.',
  );
};

const isCoordinatePair = (point) =>
  Array.isArray(point) &&
  point.length === 2 &&
  point.every(isFiniteNumber);

const validateGeometry = (
  geometry,
  message,
) => {
  if (geometry === undefined || geometry === null) {
    return;
  }

  ensure(
    Array.isArray(geometry) &&
    geometry.every(isCoordinatePair),
    message,
  );
};

const getNoAsignadoId = (item) =>
  typeof item === 'object'
    ? Number(item.pedido_id)
    : Number(item);

const validateJourneyResponse = (
  payload,
  data,
) => {
  ensure(
    data &&
    Array.isArray(data.jornadas) &&
    Array.isArray(data.pedidos_no_asignados),
    'Python devolvió una planificación multivehículo inválida',
  );

  const pedidos = payload?.pedidos ?? [];
  const camiones = payload?.camiones ?? [];
  const knownPedidos = new Set(
    pedidos.map((pedido) =>
      Number(pedido.pedido_id),
    ),
  );
  const knownCamiones = new Set(
    camiones.map((camion) =>
      Number(camion.id),
    ),
  );
  const capacidadCamion = new Map(
    camiones.map((camion) => [
      Number(camion.id),
      Number(camion.capacidad),
    ]),
  );

  const assignedPedidos = new Set();
  const usedCamiones = new Set();

  for (const jornada of data.jornadas) {
    ensure(
      jornada &&
      knownCamiones.has(Number(jornada.camion_id)),
      'Python devolvió una jornada con camión desconocido',
    );

    ensure(
      !usedCamiones.has(Number(jornada.camion_id)),
      'Python devolvió un camión duplicado en jornadas',
    );

    usedCamiones.add(Number(jornada.camion_id));

    ensure(
      Array.isArray(jornada.entregas) &&
      jornada.entregas.length > 0,
      'Python devolvió una jornada sin entregas',
    );

    ensure(
      isFiniteNumber(jornada.distancia_total_km) &&
      jornada.distancia_total_km >= 0,
      'Python devolvió una distancia total inválida',
    );

    ensure(
      isFiniteNumber(jornada.tiempo_estimado_min) &&
      jornada.tiempo_estimado_min >= 0,
      'Python devolvió un tiempo estimado inválido',
    );

    validateGeometry(
      jornada.ruta_general?.geometria,
      'Python devolvió una geometría general inválida',
    );

    ensure(
      jornada.ruta_general?.bodega &&
      Array.isArray(jornada.ruta_general?.tramos) &&
      jornada.ruta_general.tramos.at(-1)?.tipo ===
        'RETORNO_BODEGA',
      'Python devolvió una ruta que no retorna a bodega',
    );

    const capacidad = capacidadCamion.get(
      Number(jornada.camion_id),
    );

    ensure(
      jornada.entregas.length <= capacidad,
      'Python devolvió una jornada que excede la capacidad del camión',
    );

    for (const entrega of jornada.entregas) {
      const pedidoId = Number(entrega.pedido_id);

      ensure(
        knownPedidos.has(pedidoId),
        'Python devolvió un pedido desconocido en entregas',
      );

      ensure(
        !assignedPedidos.has(pedidoId),
        'Python devolvió un pedido duplicado en entregas',
      );

      assignedPedidos.add(pedidoId);

      ensure(
        Number.isInteger(Number(entrega.orden_entrega)) &&
        Number(entrega.orden_entrega) > 0,
        'Python devolvió un orden de entrega inválido',
      );

      ensure(
        isFiniteNumber(entrega.distancia_acumulada_km) &&
        entrega.distancia_acumulada_km >= 0,
        'Python devolvió una distancia acumulada inválida',
      );

      ensure(
        isFiniteNumber(entrega.tiempo_acumulado_min) &&
        entrega.tiempo_acumulado_min >= 0,
        'Python devolvió un tiempo acumulado inválido',
      );

      validateGeometry(
        entrega.ruta_parcial?.geometria,
        'Python devolvió una geometría parcial inválida',
      );
    }
  }

  const noAsignados = new Set();

  for (const item of data.pedidos_no_asignados) {
    const pedidoId = getNoAsignadoId(item);

    ensure(
      knownPedidos.has(pedidoId),
      'Python devolvió un pedido desconocido como no asignado',
    );

    ensure(
      !assignedPedidos.has(pedidoId),
      'Python devolvió un pedido asignado y no asignado simultáneamente',
    );

    ensure(
      !noAsignados.has(pedidoId),
      'Python devolvió un pedido no asignado duplicado',
    );

    noAsignados.add(pedidoId);
  }

  const totalClasificados =
    assignedPedidos.size + noAsignados.size;

  ensure(
    totalClasificados === knownPedidos.size,
    'Python omitió uno o más pedidos del resultado',
  );
};

/**
 * ---------------------------------------------------------
 * Calcular Ruta Óptima
 * ---------------------------------------------------------
 *
 * Contrato de entrada:
 *
 * {
 *    origenId,
 *    destinoId,
 *    rutas
 * }
 *
 * Contrato de salida:
 *
 * {
 *    ruta,
 *    distancia_total,
 *    tiempo_estimado
 * }
 */
export const calcularRuta = async (
  payload,
) => {
  try {
    //-------------------------------------------------------
    // Invocar servicio Python
    //-------------------------------------------------------

    const { data } =
      await pythonApi.post(
        '/api/rutas/calcular',
        payload,
        {
          timeout: getTimeout(
            'PYTHON_ROUTE_TIMEOUT_MS',
            15000,
          ),
        },
      );

    //-------------------------------------------------------
    // Validar respuesta
    //-------------------------------------------------------

    validateRouteResponse(payload, data);

    //-------------------------------------------------------
    // Devolver resultado
    //-------------------------------------------------------

    return data;
  } catch (error) {
    //-------------------------------------------------------
    // Timeout o servicio no disponible
    //-------------------------------------------------------

    throw normalizePythonError(
      error,
      'Servicio de cálculo de rutas',
    );
  }
};


export const generarJornadaMetaheuristica = async (payload) => {
  try {
    const { data } = await pythonApi.post(
      '/api/jornadas/generar',
      payload,
      {
        timeout: getTimeout(
          'PYTHON_JOURNEY_TIMEOUT_MS',
          90000,
        ),
      },
    );

    validateJourneyResponse(
      payload,
      data,
    );

    return data;
  } catch (error) {
    throw normalizePythonError(
      error,
      'Servicio de generación de jornadas',
    );
  }
};

