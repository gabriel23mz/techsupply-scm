/**
 * ---------------------------------------------------------
 * Python Service
 * ---------------------------------------------------------
 *
 * Responsabilidad:
 * Actuar como adaptador entre Node.js y el
 * algoritmo A* implementado en Python.
 *
 * Este servicio NO conoce:
 *
 * - Sequelize
 * - Pedidos
 * - Clientes
 * - Despachos
 * - Express
 *
 * Únicamente envía información a Python y
 * devuelve el resultado del cálculo.
 */

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
export const calcularRuta = async ({
  origenId,
  destinoId,
  rutas,
}) => {

  //
  // =======================================================
  // TODO (Mock):
  //
  // Durante el desarrollo del MVP esta función devuelve
  // una respuesta simulada para permitir probar todo el
  // flujo logístico sin depender todavía del algoritmo A*.
  //
  // Cuando se implemente Python únicamente se deberá
  // reemplazarse el contenido de esta función por la
  // comunicación real (HTTP, FastAPI, Flask, etc.).
  //
  // NO será necesario modificar ningún otro archivo
  // del proyecto.
  // =======================================================
  //

  console.log(
    'Python Service (Mock)',
  );

  console.log({
    origenId,
    destinoId,
    rutas,
  });

  return {
    ruta: [
      origenId,
      destinoId,
    ],

    distancia_total: 0,

    tiempo_estimado: 0,
  };
};


