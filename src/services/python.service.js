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

  timeout: 90000,
});

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
      );

    //-------------------------------------------------------
    // Validar respuesta
    //-------------------------------------------------------

    if (
      !data ||
      !Array.isArray(data.ruta) ||
      typeof data.distancia_total !==
        'number' ||
      typeof data.tiempo_estimado !==
        'number'
    ) {
      throw new Error(
        'El servicio de cálculo de rutas devolvió una respuesta inválida.',
      );
    }

    //-------------------------------------------------------
    // Devolver resultado
    //-------------------------------------------------------

    return data;
  } catch (error) {
    //-------------------------------------------------------
    // Timeout o servicio no disponible
    //-------------------------------------------------------

    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ECONNABORTED'
    ) {
      throw new Error(
        `No fue posible comunicarse con el servicio de cálculo de rutas: ${error.message}`,
        { cause: error },
      );
    }

    //-------------------------------------------------------
    // Error HTTP devuelto por Python
    //-------------------------------------------------------

    if (error.response) {
      throw new Error(
        `El servicio de cálculo de rutas devolvió un error: ${error.message}`,
        { cause: error },
      );
    }

    //-------------------------------------------------------
    // Error de validación u otro error interno
    //-------------------------------------------------------

    throw error;
  }
};


export const generarJornadaMetaheuristica = async (payload) => {
  const { data } = await pythonApi.post(
    '/api/jornadas/generar',
    payload,
  );

  if (
    !data ||
    !Array.isArray(data.jornadas) ||
    !Array.isArray(data.pedidos_no_asignados)
  ) {
    throw new Error(
      'Python devolvió una planificación multivehículo inválida',
    );
  }

  return data;
};

