import * as pedidoService from './pedido.service.js';
import * as despachoService from './despacho.service.js';
import * as rutaService from './ruta.service.js';

import * as pythonService from './python.service.js';
import * as n8nService from './n8n.service.js';

import { BODEGA_CENTRAL_ID } from '../constants/logistica.js';
import {
  BusinessRuleError,
  ConflictError,
  ExternalServiceError,
  NotFoundError,
} from '../utils/errors.js';

//
// Bodega central del sistema.
//
// Se utiliza el id para desacoplar la lógica
// del nombre de la ubicación.
//



export const generarPlanJornada = async ({
  pedidos,
  camiones,
  bodega,
  rutas,
}) => {
  const payloadPython = {
    bodega: {
      id: bodega.id,
      nombre: bodega.nombre,
      latitud: Number(bodega.latitud),
      longitud: Number(bodega.longitud),
    },

    camiones: camiones.map((camion) => ({
      id: camion.id,
      codigo: camion.codigo,
      placa: camion.placa,
      capacidad: camion.capacidad,
    })),

    pedidos: pedidos.map((pedido) => ({
      pedido_id: pedido.id,
      cliente_id: pedido.cliente_id,
      cliente: pedido.Cliente.nombre,
      destino_id: pedido.Cliente.Ubicacion.id,
      ubicacion: pedido.Cliente.Ubicacion.nombre,
      latitud: Number(pedido.Cliente.Ubicacion.latitud),
      longitud: Number(pedido.Cliente.Ubicacion.longitud),
      fecha_entrega: pedido.fecha_entrega,
    })),

    grafo: rutas.map((ruta) => ({
      origen: ruta.origen_id,
      destino: ruta.destino_id,
      distancia: Number(ruta.distancia_km),
    })),

    velocidad_kmh: 40,
  };

  return await pythonService.generarJornadaMetaheuristica(payloadPython);
};

export const notificarJornadaCreada = async (jornada, despachos) => {
  await n8nService.jornadaCreada(jornada, despachos).catch(console.error);
};

export const notificarJornadaIniciada = async (jornada) => {
  await n8nService.jornadaIniciada(jornada).catch(console.error);
};

export const notificarDespachoEntregado = async (despacho) => {
  await n8nService.despachoEntregado(despacho).catch(console.error);
};

export const notificarDespachoNoEntregado = async (despacho) => {
  await n8nService.despachoNoEntregado(despacho).catch(console.error);
};

export const notificarJornadaFinalizada = async (jornada) => {
  await n8nService.jornadaFinalizada(jornada).catch(console.error);
};




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
    throw new NotFoundError(
      'Pedido no encontrado',
      'PEDIDO_NO_ENCONTRADO',
    );
  }

  //---------------------------------------------------------
  // Validar estado
  //---------------------------------------------------------

  if (
    pedido.estado !==
    'LISTO_PARA_DESPACHO'
  ) {
    throw new BusinessRuleError(
      'El pedido debe estar LISTO_PARA_DESPACHO',
      'PEDIDO_NO_LISTO_DESPACHO',
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
    throw new BusinessRuleError(
      'El pedido no posee productos',
      'PEDIDO_SIN_DETALLES',
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
    throw new ConflictError(
      'El pedido ya posee un despacho activo',
      'PEDIDO_CON_DESPACHO_ACTIVO',
    );
  }

  //---------------------------------------------------------
  // Obtener ubicación destino
  //---------------------------------------------------------

  const cliente = pedido.Cliente;

  if (!cliente) {
    throw new BusinessRuleError(
      'El pedido no tiene un cliente asociado',
      'PEDIDO_SIN_CLIENTE',
    );
  }

  if (!cliente.ubicacion_id) {
    throw new BusinessRuleError(
      'El cliente no tiene una ubicación registrada',
      'CLIENTE_SIN_UBICACION',
    );
  }

  //---------------------------------------------------------
  // Obtener todas las rutas registradas
  //---------------------------------------------------------

  const rutas =
    await rutaService.obtenerTodas();

  if (!rutas.length) {
    throw new BusinessRuleError(
      'No existen rutas registradas',
      'RUTAS_NO_REGISTRADAS',
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
    throw new ExternalServiceError(
      'No fue posible calcular la ruta',
      'PYTHON_RUTA_SIN_RESULTADO',
    );
  }

  if (
    !resultado.ruta ||
    resultado.ruta.length === 0
  ) {
    throw new ExternalServiceError(
      'Python no devolvió una ruta válida',
      'PYTHON_RUTA_INVALIDA',
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
    throw new NotFoundError(
      'Despacho no encontrado',
      'DESPACHO_NO_ENCONTRADO',
    );
  }

  //---------------------------------------------------------
  // Validar estado
  //---------------------------------------------------------

  if (
    despacho.estado !==
    'PENDIENTE'
  ) {
    throw new BusinessRuleError(
      'Solo puede iniciarse un despacho pendiente',
      'DESPACHO_NO_INICIABLE',
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
    throw new NotFoundError(
      'Despacho no encontrado',
      'DESPACHO_NO_ENCONTRADO',
    );
  }

  //---------------------------------------------------------
  // Validar estado
  //---------------------------------------------------------

  if (
    despacho.estado !==
    'EN_TRANSITO'
  ) {
    throw new BusinessRuleError(
      'Solo puede entregarse un despacho en tránsito',
      'DESPACHO_NO_ENTREGABLE',
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
    throw new NotFoundError(
      'Despacho no encontrado',
      'DESPACHO_NO_ENCONTRADO',
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
    throw new BusinessRuleError(
      'Solo puede cancelarse un despacho activo',
      'DESPACHO_NO_CANCELABLE',
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
