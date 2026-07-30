export const solicitudRutaValida = {
  origenId: 1,
  destinoId: 3,
  rutas: [
    { origen: 1, destino: 2, distancia: 4.5 },
    { origen: 2, destino: 3, distancia: 3.5 },
  ],
};

export const respuestaRutaValida = {
  ruta: [1, 2, 3],
  distancia_total: 8,
  tiempo_estimado: 12,
};

export const solicitudJornadaValida = {
  bodega: {
    id: 1,
    nombre: 'Bodega Central',
    latitud: -2.1,
    longitud: -79.9,
  },
  camiones: [
    {
      id: 10,
      codigo: 'CAM-010',
      placa: 'ABC-010',
      capacidad: 2,
    },
  ],
  pedidos: [
    {
      pedido_id: 100,
      cliente_id: 20,
      cliente: 'Cliente Demo',
      destino_id: 3,
      ubicacion: 'Sucursal Norte',
      latitud: -2.08,
      longitud: -79.88,
      fecha_entrega: null,
    },
  ],
  grafo: [
    { origen: 1, destino: 3, distancia: 6 },
  ],
  velocidad_kmh: 40,
  max_jornada_min: 600,
  tiempo_servicio_por_entrega_min: 10,
  margen_operativo_porcentaje: 15,
  aco: {
    max_segundos: 0.25,
  },
};

export const respuestaJornadaValida = {
  jornadas: [
    {
      camion_id: 10,
      capacidad_camion: 2,
      capacidad_utilizada: 1,
      ruta_general: {
        bodega: solicitudJornadaValida.bodega,
        puntos: [
          {
            orden: 1,
            pedido_id: 100,
            cliente_id: 20,
            cliente: 'Cliente Demo',
            destino_id: 3,
            ubicacion: 'Sucursal Norte',
            latitud: -2.08,
            longitud: -79.88,
            estado: 'PENDIENTE',
          },
        ],
        geometria: [
          [-2.1, -79.9],
          [-2.08, -79.88],
          [-2.1, -79.9],
        ],
        tramos: [
          { orden: 1, tipo: 'ENTREGA', desde_indice: 0, hasta_indice: 1 },
          { orden: null, tipo: 'RETORNO_BODEGA', desde_indice: 1, hasta_indice: 2 },
        ],
      },
      distancia_total_km: 12,
      tiempo_estimado_min: 18,
      entregas: [
        {
          pedido_id: 100,
          orden_entrega: 1,
          ruta_parcial: {
            desde: solicitudJornadaValida.bodega,
            hasta: {
              id: 3,
              nombre: 'Sucursal Norte',
              latitud: -2.08,
              longitud: -79.88,
            },
            ruta_nodos: [1, 3],
            geometria: [
              [-2.1, -79.9],
              [-2.08, -79.88],
            ],
          },
          distancia_acumulada_km: 6,
          tiempo_acumulado_min: 9,
          fecha_estimada_entrega: '2026-07-23T12:00:00',
        },
      ],
    },
  ],
  pedidos_no_asignados: [],
};

export const respuestaJornadaIncompleta = {
  jornadas: [
    {
      camion_id: 10,
    },
  ],
};
