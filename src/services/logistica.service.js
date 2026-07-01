import * as pedidoService from './pedido.service.js';
import * as despachoService from './despacho.service.js';
import * as rutaService from './ruta.service.js';

import * as pythonService from './python.service.js';
import * as n8nService from './n8n.service.js';

import { BODEGA_CENTRAL_ID } from '../constants/logistica.js';

//
// Bodega central del sistema.
//
// Se utiliza el id para desacoplar la lógica
// del nombre de la ubicación.
//


/**
 * ---------------------------------------------------------
 * Obtener Pedidos Disponibles
 * ---------------------------------------------------------
 */
export const obtenerPedidosDisponibles = async () => {

  return await pedidoService.obtenerPedidosDisponibles();

};


/**
 * ---------------------------------------------------------
 * Crear Despacho
 * ---------------------------------------------------------
 *
 * Orquesta completamente el proceso logístico.
 *
 * Este servicio contiene TODA la lógica del negocio.
 *
 * No realiza persistencia directa.
 * No consulta modelos Sequelize.
 * Solo coordina servicios.
 */
export const crearDespacho = async (
  pedidoId,
) => {

  //---------------------------------------------------------
  // Buscar pedido
  //---------------------------------------------------------

  const pedido =
    await pedidoService.obtenerPorId(
      pedidoId,
    );

  if (!pedido) {
    throw new Error(
      'Pedido no encontrado',
    );
  }

  //---------------------------------------------------------
  // Validar estado
  //---------------------------------------------------------

  if (
    pedido.estado !==
    'LISTO_PARA_DESPACHO'
  ) {
    throw new Error(
      'El pedido debe estar LISTO_PARA_DESPACHO',
    );
  }

  //---------------------------------------------------------
  // Validar existencia de detalles
  //---------------------------------------------------------

  const tieneDetalles =
    await pedidoService.pedidoTieneDetalles(
      pedidoId,
    );

  if (!tieneDetalles) {
    throw new Error(
      'El pedido no posee productos',
    );
  }

  //---------------------------------------------------------
  // Validar despacho activo
  //---------------------------------------------------------

  const despachoActivo =
    await despachoService.existeDespachoActivo(
      pedidoId,
    );

  if (despachoActivo) {
    throw new Error(
      'El pedido ya posee un despacho activo',
    );
  }

  //---------------------------------------------------------
  // Obtener ubicación destino
  //---------------------------------------------------------

  const cliente = pedido.Cliente;

  if (!cliente) {
    throw new Error(
      'El pedido no tiene un cliente asociado',
    );
  }

  if (!cliente.ubicacion_id) {
    throw new Error(
      'El cliente no tiene una ubicación registrada',
    );
  }

  //---------------------------------------------------------
  // Obtener todas las rutas registradas
  //---------------------------------------------------------

  const rutas =
    await rutaService.obtenerTodas();

  if (!rutas.length) {
    throw new Error(
      'No existen rutas registradas',
    );
  }

  //---------------------------------------------------------
  // Transformar rutas al contrato esperado
  // por python.service.js
  //---------------------------------------------------------

  const conexiones =
    rutas.map((ruta) => ({
      origen: ruta.origen_id,
      destino: ruta.destino_id,
      distancia: Number(
        ruta.distancia_km,
      ),
    }));

  //---------------------------------------------------------
  // Calcular ruta óptima
  //---------------------------------------------------------

  const resultado =
    await pythonService.calcularRuta({
      origenId: BODEGA_CENTRAL_ID,
      destinoId: cliente.ubicacion_id,
      rutas: conexiones,
    });

  if (!resultado) {
    throw new Error(
      'No fue posible calcular la ruta',
    );
  }

  if (
    !resultado.ruta ||
    resultado.ruta.length === 0
  ) {
    throw new Error(
      'Python no devolvió una ruta válida',
    );
  }

  //---------------------------------------------------------
  // Persistir despacho
  //---------------------------------------------------------

  const despacho =
    await despachoService.crear({
      pedido_id:
        pedido.id,

      ruta_json:
        JSON.stringify(
          resultado.ruta,
        ),

      distancia_total:
        resultado.distancia_total,

      tiempo_estimado:
        resultado.tiempo_estimado,
    });

  //---------------------------------------------------------
  // Sincronizar estado del pedido
  //---------------------------------------------------------

  await pedidoService.sincronizarEstadoConDespacho(
    pedido.id,
    'DESPACHO_CREADO',
  );

  //---------------------------------------------------------
  // Recargar despacho
  //---------------------------------------------------------

  const despachoResultado =
  await despachoService.obtenerPorId(
    despacho.id,
  );

  //---------------------------------------------------------
  // Disparar evento
  //---------------------------------------------------------

  await n8nService.despachoCreado(
    despachoResultado,
  );

  return despachoResultado;
};


/**
 * ---------------------------------------------------------
 * Iniciar Despacho
 * ---------------------------------------------------------
 */
export const iniciarDespacho = async (
  despachoId,
) => {

  //---------------------------------------------------------
  // Buscar despacho
  //---------------------------------------------------------

  const despacho =
    await despachoService.obtenerPorId(
      despachoId,
    );

  if (!despacho) {
    throw new Error(
      'Despacho no encontrado',
    );
  }

  //---------------------------------------------------------
  // Validar estado
  //---------------------------------------------------------

  if (
    despacho.estado !==
    'PENDIENTE'
  ) {
    throw new Error(
      'Solo puede iniciarse un despacho pendiente',
    );
  }

  //---------------------------------------------------------
  // Actualizar despacho
  //---------------------------------------------------------

  const despachoActualizado =
    await despachoService.iniciar(
      despachoId,
    );

  //---------------------------------------------------------
  // Disparar evento
  //---------------------------------------------------------

  await n8nService.despachoIniciado(
    despachoActualizado,
  );

  return despachoActualizado;
};


/**
 * ---------------------------------------------------------
 * Entregar Despacho
 * ---------------------------------------------------------
 */
export const entregarDespacho = async (
  despachoId,
) => {

  //---------------------------------------------------------
  // Buscar despacho
  //---------------------------------------------------------

  const despacho =
    await despachoService.obtenerPorId(
      despachoId,
    );

  if (!despacho) {
    throw new Error(
      'Despacho no encontrado',
    );
  }

  //---------------------------------------------------------
  // Validar estado
  //---------------------------------------------------------

  if (
    despacho.estado !==
    'EN_TRANSITO'
  ) {
    throw new Error(
      'Solo puede entregarse un despacho en tránsito',
    );
  }

  //---------------------------------------------------------
  // Actualizar despacho
  //---------------------------------------------------------

  const despachoActualizado =
    await despachoService.entregar(
      despachoId,
    );

  //---------------------------------------------------------
  // Sincronizar pedido
  //---------------------------------------------------------

  await pedidoService.sincronizarEstadoConDespacho(
    despacho.pedido_id,
    'DESPACHO_ENTREGADO',
  );

  //---------------------------------------------------------
  // Recargar despacho
  //---------------------------------------------------------

  const despachoResultado =
  await despachoService.obtenerPorId(
    despachoActualizado.id,
  );

  //---------------------------------------------------------
  // Evento
  //---------------------------------------------------------

  await n8nService.despachoEntregado(
    despachoResultado,
  );

  return despachoResultado;
};


/**
 * ---------------------------------------------------------
 * Cancelar Despacho
 * ---------------------------------------------------------
 */
export const cancelarDespacho = async (
  despachoId,
) => {

  //---------------------------------------------------------
  // Buscar despacho
  //---------------------------------------------------------

  const despacho =
    await despachoService.obtenerPorId(
      despachoId,
    );

  if (!despacho) {
    throw new Error(
      'Despacho no encontrado',
    );
  }

  //---------------------------------------------------------
  // Validar estado
  //---------------------------------------------------------

  if (
    ![
      'PENDIENTE',
      'EN_TRANSITO',
    ].includes(
      despacho.estado,
    )
  ) {
    throw new Error(
      'Solo puede cancelarse un despacho activo',
    );
  }

  //---------------------------------------------------------
  // Actualizar despacho
  //---------------------------------------------------------

  const despachoActualizado =
    await despachoService.cancelar(
      despachoId,
    );

  //---------------------------------------------------------
  // Sincronizar pedido
  //---------------------------------------------------------

  await pedidoService.sincronizarEstadoConDespacho(
    despacho.pedido_id,
    'DESPACHO_CANCELADO',
  );

  //---------------------------------------------------------
  // Recargar despacho
  //---------------------------------------------------------

  const despachoResultado =
  await despachoService.obtenerPorId(
    despachoActualizado.id,
  );

  //---------------------------------------------------------
  // Evento
  //---------------------------------------------------------

  await n8nService.despachoCancelado(
    despachoResultado,
  );

  return despachoResultado;
};
