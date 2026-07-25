import * as pythonService from './python.service.js';
import * as n8nService from './n8n.service.js';

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
      cliente: pedido.cliente.nombre,
      destino_id: pedido.cliente.ubicacion.id,
      ubicacion: pedido.cliente.ubicacion.nombre,
      latitud: Number(pedido.cliente.ubicacion.latitud),
      longitud: Number(pedido.cliente.ubicacion.longitud),
      fecha_entrega: pedido.fecha_entrega,
    })),

    grafo: rutas.map((ruta) => ({
      origen: ruta.origen_id,
      destino: ruta.destino_id,
      distancia: Number(ruta.distancia_km),
    })),

    velocidad_kmh: 40,
  };

  return await pythonService.generarJornadaMetaheuristica(
    payloadPython,
  );
};

export const notificarJornadaCreada = async (
  jornada,
  despachos,
) => {
  await n8nService
    .jornadaCreada(
      jornada,
      despachos,
    )
    .catch(console.error);
};

export const notificarJornadaIniciada = async (
  jornada,
) => {
  await n8nService
    .jornadaIniciada(jornada)
    .catch(console.error);
};

export const notificarJornadaFinalizada = async (
  jornada,
) => {
  await n8nService
    .jornadaFinalizada(jornada)
    .catch(console.error);
};
