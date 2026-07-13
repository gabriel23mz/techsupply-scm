/**
 * ---------------------------------------------------------
 * n8n Service
 * ---------------------------------------------------------
 *
 * Responsabilidad:
 * Gestionar la comunicación con n8n mediante
 * Webhooks.
 *
 * Este servicio NO contiene lógica de negocio.
 *
 * Su única responsabilidad es reaccionar a los
 * eventos generados por el proceso logístico.
 *
 * Durante el desarrollo del MVP las funciones
 * permanecen como implementaciones temporales
 * (stubs), permitiendo validar el flujo completo
 * del backend sin depender de n8n.
 */

/**
 * ---------------------------------------------------------
 * Despacho Creado
 * ---------------------------------------------------------
 */
export const despachoCreado = async (
  despacho,
) => {

  //
  // =======================================================
  // TODO (Stub):
  //
  // Reemplazar este bloque por una petición HTTP
  // hacia el Webhook de n8n.
  // =======================================================
  //

  console.log(
    'n8n -> despachoCreado',
  );

  console.log(despacho);
};

/**
 * ---------------------------------------------------------
 * Despacho Iniciado
 * ---------------------------------------------------------
 */
export const despachoIniciado = async (
  despacho,
) => {

  //
  // =======================================================
  // TODO (Stub):
  // Enviar evento a n8n.
  // =======================================================
  //

  console.log(
    'n8n -> despachoIniciado',
  );

  console.log(despacho);
};

/**
 * ---------------------------------------------------------
 * Despacho Entregado
 * ---------------------------------------------------------
 */
export const despachoEntregado = async (
  despacho,
) => {

  //
  // =======================================================
  // TODO (Stub):
  // Enviar evento a n8n.
  // =======================================================
  //

  console.log(
    'n8n -> despachoEntregado',
  );

  console.log(despacho);
};

/**
 * ---------------------------------------------------------
 * Despacho Cancelado
 * ---------------------------------------------------------
 */
export const despachoCancelado = async (
  despacho,
) => {

  //
  // =======================================================
  // TODO (Stub):
  // Enviar evento a n8n.
  // =======================================================
  //

  console.log(
    'n8n -> despachoCancelado',
  );

  console.log(despacho);
};



/**
 * ---------------------------------------------------------
 * Nuevos Eventos de Jornada
 * ---------------------------------------------------------
 */
export const jornadaCreada = async (jornada, despachos) => {
  console.log('n8n -> jornadaCreada');
  console.log({ jornada, despachos });
};

export const jornadaIniciada = async (jornada) => {
  console.log('n8n -> jornadaIniciada');
  console.log(jornada);
};

export const despachoNoEntregado = async (despacho) => {
  console.log('n8n -> despachoNoEntregado');
  console.log(despacho);
};

export const jornadaFinalizada = async (jornada) => {
  console.log('n8n -> jornadaFinalizada');
  console.log(jornada);
};

