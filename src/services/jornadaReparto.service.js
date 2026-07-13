import { Op } from 'sequelize';
import db from '../models/index.js';
import sequelize from '../config/database.js';

import { BODEGA_CENTRAL_ID } from '../constants/logistica.js';
import * as logisticaService from './logistica.service.js';


const {
  Pedido,
  Cliente,
  Ubicacion,
  Ruta,
  Camion,
  JornadaReparto,
  Despacho,
} = db;



const MAX_DESVIO_PORCENTAJE = 15;

const obtenerDestinoPedido = (pedido) =>
  Number(pedido.Cliente.Ubicacion.id);

const obtenerCapacidadCamion = (camion) => {
  const capacidad = Number(camion.capacidad);

  if (!Number.isInteger(capacidad) || capacidad <= 0) {
    throw new Error(
      'El camión no tiene una capacidad válida configurada',
    );
  }

  return capacidad;
};

const calcularDesvioPorcentaje = (
  distanciaOriginal,
  distanciaNueva,
) => {
  const original = Number(distanciaOriginal);
  const nueva = Number(distanciaNueva);

  if (!Number.isFinite(original) || original <= 0) {
    return 0;
  }

  return ((nueva - original) / original) * 100;
};

const obtenerPlanUnico = (
  resultado,
  camionId,
) => {
  if (
    !resultado ||
    !Array.isArray(resultado.jornadas)
  ) {
    throw new Error(
      'Python devolvió una recalculación inválida',
    );
  }

  const plan = resultado.jornadas.find(
    (item) =>
      Number(item.camion_id) ===
      Number(camionId),
  );

  if (!plan) {
    return null;
  }

  return plan;
};


const construirMapaJornada = (jornada) => {
  const rutaJson = obtenerRutaJson(jornada);

  if (!rutaJson || !rutaJson.bodega) {
    return {
      centro: null,
      bodega: null,
      puntos_entrega: [],
      posicion_actual_orden: 0,
      proximo_punto: null,
      camion: null,
      geometria_completa: [],
      recorrido_completado: [],
      recorrido_pendiente: [],
      tramos: [],
    };
  }

  const despachosOrdenados = [...jornada.despachos].sort(
    (a, b) => a.orden_entrega - b.orden_entrega,
  );

  const puntosEntrega = despachosOrdenados.map((despacho) => {
    const pedido = despacho.Pedido;
    const cliente = pedido?.Cliente;
    const ubicacion = cliente?.Ubicacion;

    return {
      despacho_id: despacho.id,
      pedido_id: pedido?.id,
      orden: despacho.orden_entrega,
      cliente: cliente?.nombre,
      ubicacion: ubicacion?.nombre,
      latitud: Number(ubicacion?.latitud),
      longitud: Number(ubicacion?.longitud),
      estado: despacho.estado,
    };
  });

  const geometria = Array.isArray(rutaJson.geometria)
    ? rutaJson.geometria
    : [];

  const tramos = Array.isArray(rutaJson.tramos)
    ? rutaJson.tramos
    : [];

  const posicionActualOrden = Number(jornada.posicion_actual_orden || 0);

  let indiceActual = 0;

  if (jornada.estado === 'FINALIZADA' && geometria.length) {
    /*
   * La jornada finalizada representa que el camión
   * completó también el retorno a bodega.
   */
    indiceActual = geometria.length - 1;
  } else if (posicionActualOrden > 0) {
    const tramoActual = tramos.find(
      (tramo) =>
        tramo.tipo === 'ENTREGA' &&
        Number(tramo.orden) === posicionActualOrden,
    );

    if (tramoActual) {
      indiceActual = Math.min(
        Number(tramoActual.hasta_indice),
        geometria.length - 1,
      );
    }
  }

  const recorridoCompletado = geometria.length
    ? geometria.slice(0, indiceActual + 1)
    : [];

  const recorridoPendiente = geometria.length
    ? geometria.slice(indiceActual)
    : [];

  const puntoCamion = recorridoCompletado[recorridoCompletado.length - 1];

  const proximoPunto = puntosEntrega.find(
    (punto) => punto.orden === posicionActualOrden,
  );

  return {
    centro: {
      latitud: Number(rutaJson.bodega.latitud),
      longitud: Number(rutaJson.bodega.longitud),
    },

    bodega: rutaJson.bodega,
    puntos_entrega: puntosEntrega,
    posicion_actual_orden: posicionActualOrden,

    proximo_punto: proximoPunto || null,

    camion: {
      posicion_actual: puntoCamion
        ? {
          latitud: Number(puntoCamion[0]),
          longitud: Number(puntoCamion[1]),
        }
        : {
          latitud: Number(rutaJson.bodega.latitud),
          longitud: Number(rutaJson.bodega.longitud),
        },
    },

    geometria_completa: geometria,
    recorrido_completado: recorridoCompletado,
    recorrido_pendiente: recorridoPendiente,
    tramos,
  };
};

const obtenerRutaJson = (jornada) => {
  if (!jornada?.ruta_json) {
    return null;
  }

  /*
   * PostgreSQL JSONB ya devuelve un objeto.
   * Este respaldo permite tolerar registros antiguos en TEXT.
   */
  if (typeof jornada.ruta_json === 'string') {
    try {
      return JSON.parse(jornada.ruta_json);
    } catch {
      return null;
    }
  }

  return jornada.ruta_json;
};

const contarPuntosUnicos = (rutaJson) => {
  const puntos = Array.isArray(rutaJson?.puntos)
    ? rutaJson.puntos
    : [];

  return new Set(
    puntos.map((punto) => Number(punto.destino_id)),
  ).size;
};

const resumirJornadaGenerada = ({
  jornada,
  despachos,
}) => {
  const rutaJson = obtenerRutaJson(jornada);

  return {
    id: jornada.id,
    codigo: `JR-${String(jornada.id).padStart(5, '0')}`,
    camion_id: jornada.camion_id,
    fecha: jornada.fecha,
    estado: jornada.estado,

    total_despachos: despachos.length,
    total_puntos: contarPuntosUnicos(rutaJson),

    distancia_total: Number(
      jornada.distancia_total || 0,
    ),

    tiempo_estimado: Number(
      jornada.tiempo_estimado || 0,
    ),

    tiene_geometria:
      Array.isArray(rutaJson?.geometria) &&
      rutaJson.geometria.length > 0,

    total_coordenadas:
      rutaJson?.geometria?.length || 0,

    total_tramos:
      rutaJson?.tramos?.length || 0,

    despachos: despachos.map((despacho) => ({
      id: despacho.id,
      pedido_id: despacho.pedido_id,
      orden_entrega: despacho.orden_entrega,
      estado: despacho.estado,
    })),
  };
};


export const generarJornadaReparto = async () => {
  const pedidos = await Pedido.findAll({
    where: {
      estado: 'LISTO_PARA_DESPACHO',
    },
    include: [
      {
        model: Cliente,
        include: [
          {
            model: Ubicacion,
          },
        ],
      },
    ],
    order: [['id', 'ASC']],
  });

  if (!pedidos.length) {
    throw new Error(
      'No existen pedidos listos para despacho',
    );
  }

  /*
   * Un camión EN_BODEGA no necesariamente está disponible:
   * puede tener una jornada PLANIFICADA.
   */
  const jornadasActivas = await JornadaReparto.findAll({
    where: {
      estado: {
        [Op.in]: ['PLANIFICADA', 'EN_RUTA'],
      },
    },
    attributes: ['camion_id'],
  });

  const camionesOcupados = jornadasActivas.map(
    (jornada) => Number(jornada.camion_id),
  );

  const whereCamiones = {
    estado: 'EN_BODEGA',
    capacidad: {
      [Op.gt]: 0,
    },
  };

  if (camionesOcupados.length) {
    whereCamiones.id = {
      [Op.notIn]: camionesOcupados,
    };
  }

  const camiones = await Camion.findAll({
    where: whereCamiones,
    order: [
      ['capacidad', 'DESC'],
      ['id', 'ASC'],
    ],
  });

  if (!camiones.length) {
    throw new Error(
      'No existen camiones disponibles con capacidad válida',
    );
  }

  const bodega = await Ubicacion.findByPk(
    BODEGA_CENTRAL_ID,
  );

  if (!bodega) {
    throw new Error(
      'No se encontró la bodega central',
    );
  }

  if (
    bodega.latitud === null ||
    bodega.longitud === null
  ) {
    throw new Error(
      'La bodega central no tiene coordenadas registradas',
    );
  }

  const rutas = await Ruta.findAll({
    where: {
      estado: true,
    },
  });

  if (!rutas.length) {
    throw new Error(
      'No existen rutas activas para calcular las jornadas',
    );
  }

  /*
   * Se envían todos los pedidos y todos los camiones.
   * Python decide cuántas jornadas conviene crear.
   */
  const resultado =
    await logisticaService.generarPlanJornada({
      pedidos,
      camiones,
      bodega,
      rutas,
    });

  if (
    !resultado ||
    !Array.isArray(resultado.jornadas) ||
    !Array.isArray(resultado.pedidos_no_asignados)
  ) {
    throw new Error(
      'Python devolvió una planificación multivehículo inválida',
    );
  }

  if (!resultado.jornadas.length) {
    return {
      jornadas: [],
      pedidos_no_asignados:
        resultado.pedidos_no_asignados,
      mensaje:
        'No fue posible construir jornadas con los camiones disponibles',
    };
  }

  const transaction = await sequelize.transaction();

  const jornadasCreadas = [];

  try {
    const pedidosProcesados = new Set();

    for (const plan of resultado.jornadas) {
      if (
        !plan ||
        !plan.camion_id ||
        !Array.isArray(plan.entregas) ||
        !plan.entregas.length
      ) {
        continue;
      }

      /*
       * Evita que Python asigne accidentalmente
       * el mismo pedido a dos jornadas.
       */
      for (const entrega of plan.entregas) {
        const pedidoId = Number(entrega.pedido_id);

        if (pedidosProcesados.has(pedidoId)) {
          throw new Error(
            `El pedido ${pedidoId} fue asignado a más de una jornada`,
          );
        }

        pedidosProcesados.add(pedidoId);
      }

      const jornada = await JornadaReparto.create(
        {
          camion_id: plan.camion_id,
          fecha: new Date(),
          estado: 'PLANIFICADA',
          posicion_actual_orden: 0,
          ruta_json: plan.ruta_general,
          distancia_total:
            plan.distancia_total_km,
          tiempo_estimado:
            plan.tiempo_estimado_min,
        },
        {
          transaction,
        },
      );

      const despachosCreados = [];

      for (const entrega of plan.entregas) {
        const pedidoId = Number(entrega.pedido_id);

        /*
         * Bloqueo lógico adicional:
         * solo cambia un pedido todavía disponible.
         */
        const [cantidadActualizada] =
          await Pedido.update(
            {
              estado: 'DESPACHADO',
            },
            {
              where: {
                id: pedidoId,
                estado: 'LISTO_PARA_DESPACHO',
              },
              transaction,
            },
          );

        if (cantidadActualizada !== 1) {
          throw new Error(
            `El pedido ${pedidoId} ya no está disponible para despacho`,
          );
        }

        const despacho = await Despacho.create(
          {
            pedido_id: pedidoId,
            jornada_reparto_id: jornada.id,
            orden_entrega:
              entrega.orden_entrega,
            estado: 'PENDIENTE',
            ruta_json: entrega.ruta_parcial,
            distancia_total:
              entrega.distancia_acumulada_km,
            tiempo_estimado:
              entrega.tiempo_acumulado_min,
            fecha_estimada_entrega:
              entrega.fecha_estimada_entrega ||
              null,
          },
          {
            transaction,
          },
        );

        despachosCreados.push(despacho);
      }

      jornadasCreadas.push(
        resumirJornadaGenerada({
          jornada,
          despachos: despachosCreados,
        }),
      );
    }

    if (!jornadasCreadas.length) {
      throw new Error(
        'La planificación no produjo jornadas persistibles',
      );
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  /*
   * n8n siempre después del commit.
   * Un fallo de notificación no revierte la planificación.
   */
  for (const item of jornadasCreadas) {
    await logisticaService.notificarJornadaCreada(
      item.jornada,
      item.despachos,
    );
  }

  const pedidosNoAsignados = resultado.pedidos_no_asignados || [];

  const totalPedidosAsignados = jornadasCreadas.reduce(
    (total, jornada) =>
      total + jornada.total_despachos,
    0,
  );

  return {
    total_jornadas: jornadasCreadas.length,
    total_camiones_utilizados: jornadasCreadas.length,
    total_pedidos_asignados: totalPedidosAsignados,
    total_pedidos_no_asignados:
    pedidosNoAsignados.length,

    jornadas: jornadasCreadas,

    pedidos_no_asignados: pedidosNoAsignados,
  };
};

export const iniciarJornada = async (id) => {
  const jornadaId = await sequelize.transaction(
    async (transaction) => {
      const jornada = await JornadaReparto.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!jornada) {
        throw new Error(
          'Jornada de reparto no encontrada',
        );
      }

      if (jornada.estado !== 'PLANIFICADA') {
        throw new Error(
          'Solo se puede iniciar una jornada en estado PLANIFICADA',
        );
      }

      const camion = await Camion.findByPk(
        jornada.camion_id,
        {
          transaction,
          lock: transaction.LOCK.UPDATE,
        },
      );

      if (!camion) {
        throw new Error(
          'El camión asociado a la jornada no existe',
        );
      }

      if (camion.estado !== 'EN_BODEGA') {
        throw new Error(
          'La jornada solo puede iniciar si el camión está EN_BODEGA',
        );
      }

      const despachos = await Despacho.findAll({
        where: {
          jornada_reparto_id: jornada.id,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!despachos.length) {
        throw new Error(
          'La jornada no posee despachos asignados',
        );
      }

      const despachoNoPendiente = despachos.find(
        (despacho) =>
          despacho.estado !== 'PENDIENTE',
      );

      if (despachoNoPendiente) {
        throw new Error(
          'Todos los despachos deben estar PENDIENTES antes de iniciar la jornada',
        );
      }

      const ordenes = despachos
        .map((despacho) =>
          Number(despacho.orden_entrega),
        )
        .filter((orden) =>
          Number.isInteger(orden) && orden > 0,
        );

      if (!ordenes.length) {
        throw new Error(
          'Los despachos no tienen un orden de entrega válido',
        );
      }

      const primerOrden = Math.min(...ordenes);
      const fechaSalida = new Date();

      await jornada.update(
        {
          estado: 'EN_RUTA',
          fecha_salida: fechaSalida,
          posicion_actual_orden: primerOrden,
        },
        {
          transaction,
        },
      );

      await camion.update(
        {
          estado: 'EN_RUTA',
        },
        {
          transaction,
        },
      );

      const [despachosActualizados] =
        await Despacho.update(
          {
            estado: 'EN_TRANSITO',
            fecha_salida: fechaSalida,
          },
          {
            where: {
              jornada_reparto_id: jornada.id,
              estado: 'PENDIENTE',
            },
            transaction,
          },
        );

      if (
        despachosActualizados !==
        despachos.length
      ) {
        throw new Error(
          'No fue posible iniciar todos los despachos de la jornada',
        );
      }

      return jornada.id;
    },
  );

  /*
   * La transacción ya fue confirmada.
   * Ahora recargamos toda la información para n8n.
   */
  const jornadaActualizada =
    await JornadaReparto.findByPk(jornadaId, {
      include: [
        {
          model: Camion,
          as: 'camion',
        },
        {
          model: Despacho,
          as: 'despachos',
          include: [
            {
              model: Pedido,
              include: [
                {
                  model: Cliente,
                  include: [
                    {
                      model: Ubicacion,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      order: [
        [
          {
            model: Despacho,
            as: 'despachos',
          },
          'orden_entrega',
          'ASC',
        ],
        [
          {
            model: Despacho,
            as: 'despachos',
          },
          'id',
          'ASC',
        ],
      ],
    });

  if (!jornadaActualizada) {
    throw new Error(
      'No fue posible recuperar la jornada iniciada',
    );
  }

  /*
   * n8n fuera de la transacción:
   * un fallo de notificación no revierte la salida.
   */
  await logisticaService.notificarJornadaIniciada(
    jornadaActualizada,
  );

  return jornadaActualizada;
};

export const avanzarJornada = async (id) => {
  const jornada = await JornadaReparto.findByPk(id, {
    include: [
      {
        model: Despacho,
        as: 'despachos',
      },
    ],
  });

  if (!jornada) {
    throw new Error('Jornada de reparto no encontrada');
  }

  if (jornada.estado !== 'EN_RUTA') {
    throw new Error('Solo se puede avanzar una jornada en estado EN_RUTA');
  }

  const posicionActual = Number(jornada.posicion_actual_orden);

  const despachosPuntoActual = jornada.despachos.filter(
    (despacho) => Number(despacho.orden_entrega) === posicionActual,
  );

  if (!despachosPuntoActual.length) {
    throw new Error('No existen despachos para la posición actual de la jornada');
  }

  const todosCerrados = despachosPuntoActual.every((despacho) =>
    ['ENTREGADO', 'NO_ENTREGADO'].includes(despacho.estado),
  );

  if (!todosCerrados) {
    throw new Error(
      'No se puede avanzar hasta entregar o marcar como no entregados todos los despachos del punto actual',
    );
  }

  const ordenesPendientes = jornada.despachos
    .filter(
      (despacho) =>
        Number(despacho.orden_entrega) > posicionActual &&
        despacho.estado === 'EN_TRANSITO',
    )
    .map((despacho) => Number(despacho.orden_entrega));

  if (!ordenesPendientes.length) {
    throw new Error('La jornada ya no tiene más puntos pendientes por recorrer');
  }

  const siguienteOrden = Math.min(...ordenesPendientes);

  await jornada.update({
    posicion_actual_orden: siguienteOrden,
  });

  return JornadaReparto.findByPk(id, {
    include: [
      {
        model: Camion,
        as: 'camion',
      },
      {
        model: Despacho,
        as: 'despachos',
      },
    ],
  });
};

export const finalizarJornada = async (id) => {
  const jornadaId = await sequelize.transaction(
    async (transaction) => {
      const jornada = await JornadaReparto.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!jornada) {
        throw new Error(
          'Jornada de reparto no encontrada',
        );
      }

      if (jornada.estado !== 'EN_RUTA') {
        throw new Error(
          'Solo se puede finalizar una jornada en estado EN_RUTA',
        );
      }

      const camion = await Camion.findByPk(
        jornada.camion_id,
        {
          transaction,
          lock: transaction.LOCK.UPDATE,
        },
      );

      if (!camion) {
        throw new Error(
          'El camión asociado a la jornada no existe',
        );
      }

      if (camion.estado !== 'EN_RUTA') {
        throw new Error(
          'El camión asociado debe estar EN_RUTA para finalizar la jornada',
        );
      }

      const despachos = await Despacho.findAll({
        where: {
          jornada_reparto_id: jornada.id,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!despachos.length) {
        throw new Error(
          'La jornada no posee despachos',
        );
      }

      /*
       * Todos deben encontrarse en un estado terminal.
       * No se permite finalizar con PENDIENTE o EN_TRANSITO.
       */
      const estadosTerminales = [
        'ENTREGADO',
        'NO_ENTREGADO',
        'CANCELADO',
      ];

      const despachosSinCerrar = despachos.filter(
        (despacho) =>
          !estadosTerminales.includes(
            despacho.estado,
          ),
      );

      if (despachosSinCerrar.length > 0) {
        throw new Error(
          'No se puede finalizar la jornada mientras existan despachos pendientes o en tránsito',
        );
      }

      const despachosNoEntregados =
        despachos.filter(
          (despacho) =>
            despacho.estado ===
            'NO_ENTREGADO',
        );

      /*
       * Mientras la jornada estaba activa:
       * Pedido = REPROGRAMADO.
       *
       * Al volver el camión a bodega:
       * Pedido = LISTO_PARA_DESPACHO.
       */
      for (
        const despacho
        of despachosNoEntregados
      ) {
        const [pedidosActualizados] =
          await Pedido.update(
            {
              estado:
                'LISTO_PARA_DESPACHO',
            },
            {
              where: {
                id: despacho.pedido_id,
                estado: 'REPROGRAMADO',
              },
              transaction,
            },
          );

        if (pedidosActualizados !== 1) {
          throw new Error(
            `El pedido ${despacho.pedido_id} no se encontraba REPROGRAMADO`,
          );
        }
      }

      const fechaFinalizacion = new Date();

      await jornada.update(
        {
          estado: 'FINALIZADA',
          fecha_finalizacion:
            fechaFinalizacion,
        },
        {
          transaction,
        },
      );

      await camion.update(
        {
          estado: 'EN_BODEGA',
        },
        {
          transaction,
        },
      );

      return jornada.id;
    },
  );

  /*
   * Se recarga después del commit.
   */
  const jornadaFinalizada =
    await JornadaReparto.findByPk(jornadaId, {
      include: [
        {
          model: Camion,
          as: 'camion',
        },
        {
          model: Despacho,
          as: 'despachos',
          include: [
            {
              model: Pedido,
              include: [
                {
                  model: Cliente,
                  include: [
                    {
                      model: Ubicacion,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      order: [
        [
          {
            model: Despacho,
            as: 'despachos',
          },
          'orden_entrega',
          'ASC',
        ],
        [
          {
            model: Despacho,
            as: 'despachos',
          },
          'id',
          'ASC',
        ],
      ],
    });

  if (!jornadaFinalizada) {
    throw new Error(
      'No fue posible recuperar la jornada finalizada',
    );
  }

  /*
   * Resumen interno mediante n8n después del commit.
   */
  await logisticaService.notificarJornadaFinalizada(
    jornadaFinalizada,
  );

  return jornadaFinalizada;
};

export const obtenerJornadas = async () => {
  const jornadas = await JornadaReparto.findAll({
    attributes: [
      'id',
      'camion_id',
      'fecha',
      'fecha_salida',
      'fecha_finalizacion',
      'estado',
      'posicion_actual_orden',
      'distancia_total',
      'tiempo_estimado',
      'created_at',
      'updated_at',
    ],

    include: [
      {
        model: Camion,
        as: 'camion',
        attributes: [
          'id',
          'codigo',
          'placa',
          'descripcion',
          'capacidad',
          'estado',
        ],
      },
      {
        model: Despacho,
        as: 'despachos',
        attributes: [
          'id',
          'pedido_id',
          'orden_entrega',
          'estado',
          'fecha_estimada_entrega',
        ],
        required: false,
      },
    ],

    order: [
      ['created_at', 'DESC'],
      [
        { model: Despacho, as: 'despachos' },
        'orden_entrega',
        'ASC',
      ],
      [
        { model: Despacho, as: 'despachos' },
        'id',
        'ASC',
      ],
    ],
  });

  return jornadas.map((jornada) => {
    const plain = jornada.toJSON();
    const despachos = plain.despachos || [];

    const totalEntregados = despachos.filter(
      (despacho) =>
        despacho.estado === 'ENTREGADO',
    ).length;

    const totalNoEntregados = despachos.filter(
      (despacho) =>
        despacho.estado === 'NO_ENTREGADO',
    ).length;

    const totalPendientes = despachos.filter(
      (despacho) =>
        ['PENDIENTE', 'EN_TRANSITO'].includes(
          despacho.estado,
        ),
    ).length;

    const totalPuntos = new Set(
      despachos
        .map((despacho) =>
          Number(despacho.orden_entrega),
        )
        .filter((orden) => Number.isFinite(orden)),
    ).size;

    return {
      id: plain.id,
      codigo: `JR-${String(plain.id).padStart(5, '0')}`,
      fecha: plain.fecha,
      fecha_salida: plain.fecha_salida,
      fecha_finalizacion:
        plain.fecha_finalizacion,
      estado: plain.estado,
      posicion_actual_orden:
        plain.posicion_actual_orden,

      distancia_total: Number(
        plain.distancia_total || 0,
      ),

      tiempo_estimado: Number(
        plain.tiempo_estimado || 0,
      ),

      camion: plain.camion,

      resumen: {
        total_despachos: despachos.length,
        total_puntos: totalPuntos,
        entregados: totalEntregados,
        no_entregados: totalNoEntregados,
        pendientes: totalPendientes,
      },
    };
  });
};

export const obtenerJornadaPorId = async (id) => {
  const jornada = await JornadaReparto.findByPk(id, {
    include: [
      {
        model: Camion,
        as: 'camion',
      },
      {
        model: Despacho,
        as: 'despachos',
        include: [
          {
            model: Pedido,
            include: [
              {
                model: Cliente,
                include: [
                  {
                    model: Ubicacion,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],

    order: [
      [
        { model: Despacho, as: 'despachos' },
        'orden_entrega',
        'ASC',
      ],
      [
        { model: Despacho, as: 'despachos' },
        'id',
        'ASC',
      ],
    ],
  });

  if (!jornada) {
    throw new Error(
      'Jornada de reparto no encontrada',
    );
  }

  const jornadaJson = jornada.toJSON();

  /*
   * Evitamos devolver ruta_json y mapa con la misma
   * geometría duplicada.
   */
  delete jornadaJson.ruta_json;

  return {
    ...jornadaJson,
    codigo: `JR-${String(jornada.id).padStart(5, '0')}`,
    mapa: construirMapaJornada(jornada),
  };
};

export const recalcularJornada = async (id) => {
  /*
   * =====================================================
   * 1. Obtener jornada completa
   * =====================================================
   */

  const jornada = await JornadaReparto.findByPk(id, {
    include: [
      {
        model: Camion,
        as: 'camion',
      },
      {
        model: Despacho,
        as: 'despachos',
        include: [
          {
            model: Pedido,
            include: [
              {
                model: Cliente,
                include: [
                  {
                    model: Ubicacion,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    order: [
      [
        { model: Despacho, as: 'despachos' },
        'orden_entrega',
        'ASC',
      ],
      [
        { model: Despacho, as: 'despachos' },
        'id',
        'ASC',
      ],
    ],
  });

  if (!jornada) {
    throw new Error('Jornada de reparto no encontrada');
  }

  /*
   * =====================================================
   * 2. Validaciones de negocio
   * =====================================================
   */

  if (jornada.estado !== 'PLANIFICADA') {
    throw new Error(
      'Solo se puede recalcular una jornada PLANIFICADA',
    );
  }

  if (!jornada.camion) {
    throw new Error(
      'La jornada no tiene un camión asociado',
    );
  }

  if (jornada.camion.estado !== 'EN_BODEGA') {
    throw new Error(
      'Solo se puede recalcular si el camión está EN_BODEGA',
    );
  }

  if (!jornada.despachos.length) {
    throw new Error(
      'La jornada no posee despachos para recalcular',
    );
  }

  const tieneDespachosNoPendientes =
    jornada.despachos.some(
      (despacho) => despacho.estado !== 'PENDIENTE',
    );

  if (tieneDespachosNoPendientes) {
    throw new Error(
      'No se puede recalcular una jornada con despachos que ya cambiaron de estado',
    );
  }

  /*
   * =====================================================
   * 3. Capacidad disponible
   * =====================================================
   */

  const capacidad = obtenerCapacidadCamion(
    jornada.camion,
  );

  const cantidadActual = jornada.despachos.length;

  const espaciosDisponibles =
    capacidad - cantidadActual;

  if (espaciosDisponibles <= 0) {
    throw new Error(
      'El camión ya alcanzó su capacidad máxima de pedidos',
    );
  }

  /*
   * =====================================================
   * 4. Buscar nuevos pedidos disponibles
   * =====================================================
   */

  const nuevosPedidos = await Pedido.findAll({
    where: {
      estado: 'LISTO_PARA_DESPACHO',
    },
    include: [
      {
        model: Cliente,
        include: [
          {
            model: Ubicacion,
          },
        ],
      },
    ],
    order: [['id', 'ASC']],
  });

  if (!nuevosPedidos.length) {
    throw new Error(
      'No existen pedidos nuevos para incorporar',
    );
  }

  /*
   * Solo se evalúan tantos pedidos como espacios
   * tenga disponibles el camión.
   */
  const pedidosCandidatos = nuevosPedidos.slice(
    0,
    espaciosDisponibles,
  );

  const pedidosSinEspacio = nuevosPedidos.slice(
    espaciosDisponibles,
  );

  /*
   * =====================================================
   * 5. Preparar pedidos y destinos actuales
   * =====================================================
   */

  const pedidosActuales = jornada.despachos.map(
    (despacho) => despacho.Pedido,
  );

  const pedidosActualesIds = new Set(
    pedidosActuales.map(
      (pedido) => Number(pedido.id),
    ),
  );

  const destinosActuales = new Map();

  for (const despacho of jornada.despachos) {
    const pedido = despacho.Pedido;

    if (
      !pedido ||
      !pedido.Cliente ||
      !pedido.Cliente.Ubicacion
    ) {
      throw new Error(
        `El despacho ${despacho.id} no posee una ubicación válida`,
      );
    }

    const destinoId = obtenerDestinoPedido(
      pedido,
    );

    /*
     * Guardamos un despacho como referencia del punto.
     * Todos los pedidos del mismo destino comparten orden.
     */
    if (!destinosActuales.has(destinoId)) {
      destinosActuales.set(
        destinoId,
        despacho,
      );
    }
  }

  /*
   * =====================================================
   * 6. Separar casos
   * =====================================================
   */

  const incorporadosDirectos = [];
  const candidatosNuevaUbicacion = [];
  const rechazados = [];

  for (const pedido of pedidosSinEspacio) {
    rechazados.push({
      pedido_id: pedido.id,
      motivo: 'SIN_CAPACIDAD_DISPONIBLE',
    });
  }

  for (const pedido of pedidosCandidatos) {
    if (
      !pedido.Cliente ||
      !pedido.Cliente.Ubicacion
    ) {
      rechazados.push({
        pedido_id: pedido.id,
        motivo: 'PEDIDO_SIN_UBICACION_VALIDA',
      });

      continue;
    }

    const destinoId = obtenerDestinoPedido(
      pedido,
    );

    const despachoReferencia =
      destinosActuales.get(destinoId);

    if (despachoReferencia) {
      /*
       * Caso A:
       * El camión ya pasa por esa ubicación.
       */
      incorporadosDirectos.push({
        pedido,
        despachoReferencia,
      });
    } else {
      /*
       * Caso B:
       * La ubicación no está en la ruta actual.
       */
      candidatosNuevaUbicacion.push(
        pedido,
      );
    }
  }

  /*
   * =====================================================
   * 7. Datos logísticos
   * =====================================================
   */

  const bodega = await Ubicacion.findByPk(
    BODEGA_CENTRAL_ID,
  );

  if (!bodega) {
    throw new Error(
      'No se encontró la bodega central',
    );
  }

  if (
    bodega.latitud === null ||
    bodega.longitud === null
  ) {
    throw new Error(
      'La bodega central no tiene coordenadas registradas',
    );
  }

  const rutas = await Ruta.findAll({
    where: {
      estado: true,
    },
  });

  if (!rutas.length) {
    throw new Error(
      'No existen rutas activas',
    );
  }

  /*
   * =====================================================
   * 8. Evaluar ubicaciones nuevas una por una
   * =====================================================
   */

  const incorporadosNuevaUbicacion = [];

  let pedidosPlanificados = [
    ...pedidosActuales,
  ];

  let resultadoPlanificado = null;

  let distanciaReferencia = Number(
    jornada.distancia_total,
  );

  for (
    const pedidoCandidato
    of candidatosNuevaUbicacion
  ) {
    const propuestaPedidos = [
      ...pedidosPlanificados,
      pedidoCandidato,
    ];

    const resultadoPython =
      await logisticaService.generarPlanJornada({
        pedidos: propuestaPedidos,
        camiones: [jornada.camion],
        bodega,
        rutas,
      });

    const resultadoPropuesto =
      obtenerPlanUnico(
        resultadoPython,
        jornada.camion.id,
      );

    if (!resultadoPropuesto) {
      rechazados.push({
        pedido_id: pedidoCandidato.id,
        motivo: 'SIN_CAPACIDAD_O_RUTA_FACTIBLE',
      });

      continue;
    }

    const pedidoNoAsignado =
      resultadoPython.pedidos_no_asignados.some(
        (pedidoId) =>
          Number(pedidoId) ===
          Number(pedidoCandidato.id),
      );

    if (pedidoNoAsignado) {
      rechazados.push({
        pedido_id: pedidoCandidato.id,
        motivo: 'SIN_CAPACIDAD_O_RUTA_FACTIBLE',
      });

      continue;
    }

    const desvioPorcentaje =
      calcularDesvioPorcentaje(
        distanciaReferencia,
        resultadoPropuesto.distancia_total_km,
      );

    if (
      desvioPorcentaje >
      MAX_DESVIO_PORCENTAJE
    ) {
      rechazados.push({
        pedido_id: pedidoCandidato.id,
        motivo: 'EXCEDE_DESVIO_PERMITIDO',
        desvio_porcentaje: Number(
          desvioPorcentaje.toFixed(2),
        ),
      });

      continue;
    }

    pedidosPlanificados = propuestaPedidos;
    resultadoPlanificado =
      resultadoPropuesto;

    distanciaReferencia = Number(
      resultadoPropuesto.distancia_total_km,
    );

    incorporadosNuevaUbicacion.push({
      pedido: pedidoCandidato,
      desvio_porcentaje: Number(
        desvioPorcentaje.toFixed(2),
      ),
    });
  }

  /*
   * =====================================================
   * 9. Si hubo destino nuevo aceptado, generar resultado
   *    definitivo incluyendo también inserciones directas
   * =====================================================
   */

  if (resultadoPlanificado) {
    const pedidosDirectos =
      incorporadosDirectos.map(
        ({ pedido }) => pedido,
      );

    const pedidosFinales = [
      ...pedidosPlanificados,
      ...pedidosDirectos,
    ];

    const resultadoFinalPython =
      await logisticaService.generarPlanJornada({
        pedidos: pedidosFinales,
        camiones: [jornada.camion],
        bodega,
        rutas,
      });

    resultadoPlanificado =
      obtenerPlanUnico(
        resultadoFinalPython,
        jornada.camion.id,
      );

    if (!resultadoPlanificado) {
      throw new Error(
        'Python no pudo generar la jornada recalculada',
      );
    }

    /*
     * Ningún pedido esperado puede quedar fuera
     * de la planificación final.
     */
    const pedidosNoAsignados = new Set(
      resultadoFinalPython
        .pedidos_no_asignados
        .map(Number),
    );

    const pedidoEsperadoNoAsignado =
      pedidosFinales.find(
        (pedido) =>
          pedidosNoAsignados.has(
            Number(pedido.id),
          ),
      );

    if (pedidoEsperadoNoAsignado) {
      throw new Error(
        `Python no pudo asignar el pedido ${pedidoEsperadoNoAsignado.id} en la recalculación final`,
      );
    }

    /*
     * Validar duplicados y cobertura completa.
     */
    const idsEntregas = resultadoPlanificado
      .entregas
      .map(
        (entrega) =>
          Number(entrega.pedido_id),
      );

    const idsEntregasUnicos = new Set(
      idsEntregas,
    );

    if (
      idsEntregas.length !==
      idsEntregasUnicos.size
    ) {
      throw new Error(
        'Python devolvió pedidos duplicados en la jornada recalculada',
      );
    }

    const idsEsperados = new Set(
      pedidosFinales.map(
        (pedido) => Number(pedido.id),
      ),
    );

    const faltanPedidos = [
      ...idsEsperados,
    ].some(
      (pedidoId) =>
        !idsEntregasUnicos.has(pedidoId),
    );

    if (faltanPedidos) {
      throw new Error(
        'Python no incluyó todos los pedidos esperados en la jornada recalculada',
      );
    }
  }

  /*
   * Si no se aceptó ningún pedido, no modificamos
   * la base de datos.
   */
  if (
    !resultadoPlanificado &&
    !incorporadosDirectos.length
  ) {
    return {
      jornada:
        await obtenerJornadaPorId(
          jornada.id,
        ),
      incorporados: [],
      rechazados,
    };
  }

  /*
   * =====================================================
   * 10. Persistencia atómica
   * =====================================================
   */

  const transaction =
    await sequelize.transaction();

  try {
    /*
     * -----------------------------------------------------
     * CASO B:
     * Existe al menos una ubicación nueva aceptada.
     * Se reconstruye la planificación completa.
     * -----------------------------------------------------
     */
    if (resultadoPlanificado) {
      await Despacho.destroy({
        where: {
          jornada_reparto_id: jornada.id,
        },
        transaction,
      });

      await jornada.update(
        {
          ruta_json: resultadoPlanificado.ruta_general,
          distancia_total: resultadoPlanificado.distancia_total_km,
          tiempo_estimado: resultadoPlanificado.tiempo_estimado_min,
          posicion_actual_orden: 0,
        },
        {
          transaction,
        },
      );

      for (
        const entrega
        of resultadoPlanificado.entregas
      ) {
        const pedidoId = Number(
          entrega.pedido_id,
        );

        /*
         * Los pedidos antiguos ya están DESPACHADO.
         * Los nuevos deben seguir LISTO_PARA_DESPACHO.
         */
        const estadosPermitidos =
          pedidosActualesIds.has(pedidoId)
            ? ['DESPACHADO']
            : ['LISTO_PARA_DESPACHO'];

        const [cantidadActualizada] =
          await Pedido.update(
            {
              estado: 'DESPACHADO',
            },
            {
              where: {
                id: pedidoId,
                estado: {
                  [Op.in]:
                    estadosPermitidos,
                },
              },
              transaction,
            },
          );

        if (cantidadActualizada !== 1) {
          throw new Error(
            `El pedido ${pedidoId} cambió de estado durante la recalculación`,
          );
        }

        await Despacho.create(
          {
            pedido_id: pedidoId,
            jornada_reparto_id: jornada.id,
            orden_entrega: entrega.orden_entrega,
            estado: 'PENDIENTE',
            ruta_json: entrega.ruta_parcial,
            distancia_total: entrega.distancia_acumulada_km,
            tiempo_estimado: entrega.tiempo_acumulado_min,
            fecha_estimada_entrega: entrega.fecha_estimada_entrega || null,
          },
          {
            transaction,
          },
        );
      }
    } else {
      /*
       * ---------------------------------------------------
       * CASO A:
       * Solo existen pedidos para destinos ya recorridos
       * por la ruta planificada.
       *
       * No se modifica geometría ni orden de la ruta.
       * ---------------------------------------------------
       */

      const rutaJson = jornada.ruta_json
        ? structuredClone(jornada.ruta_json)
        : {
          bodega: null,
          puntos: [],
          geometria: [],
          tramos: [],
        };

      if (!Array.isArray(rutaJson.puntos)) {
        rutaJson.puntos = [];
      }

      for (
        const {
          pedido,
          despachoReferencia,
        }
        of incorporadosDirectos
      ) {
        const rutaParcialReferencia =
          despachoReferencia.ruta_json
            ? structuredClone(despachoReferencia.ruta_json)
            : null;

        const [cantidadActualizada] =
          await Pedido.update(
            {
              estado: 'DESPACHADO',
            },
            {
              where: {
                id: pedido.id,
                estado:
                  'LISTO_PARA_DESPACHO',
              },
              transaction,
            },
          );

        if (cantidadActualizada !== 1) {
          throw new Error(
            `El pedido ${pedido.id} ya no está disponible para despacho`,
          );
        }

        await Despacho.create(
          {
            pedido_id: pedido.id,
            jornada_reparto_id: jornada.id,
            orden_entrega: despachoReferencia.orden_entrega,
            estado: 'PENDIENTE',
            ruta_json: rutaParcialReferencia,
            distancia_total: despachoReferencia.distancia_total,
            tiempo_estimado: despachoReferencia.tiempo_estimado,
            fecha_estimada_entrega: despachoReferencia.fecha_estimada_entrega,
          },
          {
            transaction,
          },
        );

        rutaJson.puntos.push({
          orden: Number(
            despachoReferencia
              .orden_entrega,
          ),
          pedido_id: pedido.id,
          cliente_id:
            pedido.cliente_id,
          cliente:
            pedido.Cliente.nombre,
          destino_id:
            pedido.Cliente.Ubicacion.id,
          ubicacion:
            pedido.Cliente.Ubicacion
              .nombre,
          latitud: Number(
            pedido.Cliente.Ubicacion
              .latitud,
          ),
          longitud: Number(
            pedido.Cliente.Ubicacion
              .longitud,
          ),
          estado: 'PENDIENTE',
        });
      }

      rutaJson.puntos.sort(
        (a, b) =>
          Number(a.orden) -
            Number(b.orden) ||
          Number(a.pedido_id) -
            Number(b.pedido_id),
      );

      await jornada.update(
        {
          ruta_json: rutaJson,
        },
        {
          transaction,
        },
      );
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  /*
   * =====================================================
   * 11. Respuesta
   * =====================================================
   */

  return {
    jornada:
      await obtenerJornadaPorId(
        jornada.id,
      ),

    incorporados: [
      ...incorporadosDirectos.map(
        ({
          pedido,
          despachoReferencia,
        }) => ({
          pedido_id: pedido.id,
          tipo: 'DESTINO_EXISTENTE',
          orden_entrega: Number(
            despachoReferencia
              .orden_entrega,
          ),
        }),
      ),

      ...incorporadosNuevaUbicacion.map(
        ({
          pedido,
          desvio_porcentaje,
        }) => ({
          pedido_id: pedido.id,
          tipo: 'NUEVA_UBICACION',
          desvio_porcentaje,
        }),
      ),
    ],

    rechazados,
  };
};

export const obtenerMapaGeneral = async () => {
  const jornadas = await JornadaReparto.findAll({
    where: {
      estado: [
        'PLANIFICADA',
        'EN_RUTA',
      ],
    },

    include: [
      {
        model: Camion,
        as: 'camion',
        attributes: [
          'id',
          'codigo',
          'placa',
          'descripcion',
          'capacidad',
          'estado',
        ],
      },
      {
        model: Despacho,
        as: 'despachos',
        attributes: [
          'id',
          'pedido_id',
          'orden_entrega',
          'estado',
          'fecha_estimada_entrega',
        ],

        include: [
          {
            model: Pedido,
            attributes: [
              'id',
              'cliente_id',
              'estado',
              'fecha_entrega',
            ],

            include: [
              {
                model: Cliente,
                attributes: [
                  'id',
                  'nombre',
                  'direccion',
                ],

                include: [
                  {
                    model: Ubicacion,
                    attributes: [
                      'id',
                      'nombre',
                      'latitud',
                      'longitud',
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],

    order: [
      ['id', 'ASC'],
      [
        { model: Despacho, as: 'despachos' },
        'orden_entrega',
        'ASC',
      ],
      [
        { model: Despacho, as: 'despachos' },
        'id',
        'ASC',
      ],
    ],
  });

  if (!jornadas.length) {
    return {
      bodega: null,
      total_jornadas: 0,
      jornadas: [],
    };
  }

  const jornadasMapa = jornadas.map((jornada) => {
    const mapa = construirMapaJornada(jornada);
    const despachos = jornada.despachos || [];

    return {
      id: jornada.id,
      codigo: `JR-${String(jornada.id).padStart(5, '0')}`,
      estado: jornada.estado,
      fecha: jornada.fecha,
      fecha_salida: jornada.fecha_salida,

      posicion_actual_orden:
        jornada.posicion_actual_orden,

      distancia_total: Number(
        jornada.distancia_total || 0,
      ),

      tiempo_estimado: Number(
        jornada.tiempo_estimado || 0,
      ),

      camion: jornada.camion,

      resumen: {
        total_despachos: despachos.length,

        entregados: despachos.filter(
          (despacho) =>
            despacho.estado === 'ENTREGADO',
        ).length,

        no_entregados: despachos.filter(
          (despacho) =>
            despacho.estado === 'NO_ENTREGADO',
        ).length,

        pendientes: despachos.filter(
          (despacho) =>
            ['PENDIENTE', 'EN_TRANSITO'].includes(
              despacho.estado,
            ),
        ).length,
      },

      mapa: {
        puntos_entrega: mapa.puntos_entrega,
        recorrido_completado:
          mapa.recorrido_completado,
        recorrido_pendiente:
          mapa.recorrido_pendiente,
        posicion_actual:
          mapa.camion?.posicion_actual || null,
        proximo_punto: mapa.proximo_punto,
      },
    };
  });

  const primeraRuta = obtenerRutaJson(
    jornadas[0],
  );

  return {
    bodega: primeraRuta?.bodega || null,
    total_jornadas: jornadasMapa.length,
    jornadas: jornadasMapa,
  };
};

