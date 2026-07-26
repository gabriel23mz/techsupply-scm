import { Op } from 'sequelize';
import db from '../models/index.js';
import sequelize from '../config/database.js';

import { BODEGA_CENTRAL_ID } from '../constants/logistica.js';
import * as logisticaService from './logistica.service.js';
import {
  agregarMinutosOperativos,
  calcularDuracionOperativaMin,
  calcularEntregaEstimada,
  derivarAtrasoJornada,
  getLogisticTimeConfig,
  getOperationalDate,
  resolveInicioEstimado,
} from '../utils/logisticTime.js';
import {
  BusinessRuleError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors.js';
import {
  PERMISSIONS,
  ROLES,
  hasPermission,
  isAdmin,
} from '../constants/permissions.js';


const {
  Pedido,
  Cliente,
  Ubicacion,
  Ruta,
  Camion,
  JornadaReparto,
  Despacho,
  Chofer,
  Usuario,
  DetallePedido,
} = db;



const MAX_DESVIO_PORCENTAJE = 15;
const ESTADOS_JORNADA_ACTIVA = [
  'PLANIFICADA',
  'EN_RUTA',
];

const formatearFechaLocal = (
  fecha = new Date(),
) => {
  if (typeof fecha === 'string') {
    return fecha.slice(0, 10);
  }

  const valor = fecha instanceof Date
    ? fecha
    : new Date(fecha);

  const year = valor.getFullYear();
  const month = String(
    valor.getMonth() + 1,
  ).padStart(2, '0');
  const day = String(
    valor.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const construirWhereConflictoRecurso = ({
  fecha,
  camionId,
  choferId,
  excluirJornadaId,
}) => {
  const where = {
    [Op.or]: [
      {
        fecha: formatearFechaLocal(fecha),
        estado: {
          [Op.in]: ESTADOS_JORNADA_ACTIVA,
        },
      },
      {
        estado: 'EN_RUTA',
      },
    ],
  };

  if (camionId !== undefined) {
    where.camion_id = camionId;
  }

  if (choferId !== undefined) {
    where.chofer_id = choferId;
  }

  if (excluirJornadaId !== undefined) {
    where.id = {
      [Op.ne]: excluirJornadaId,
    };
  }

  return where;
};

const validarFechaOperativa = ({
  fechaSolicitada,
  now,
  timezone,
}) => {
  const fechaOperativa =
    getOperationalDate(now, timezone);

  if (
    fechaSolicitada &&
    formatearFechaLocal(fechaSolicitada) !==
      fechaOperativa
  ) {
    throw new BusinessRuleError(
      'La generación solo puede ejecutarse para la fecha operativa actual',
      'GENERACION_FUERA_DE_FECHA_OPERATIVA',
    );
  }

  return fechaOperativa;
};

const validarInicioEstimadoSolicitado = ({
  inicioEstimadoEn,
  fechaOperativa,
  now,
  timezone,
}) => {
  if (!inicioEstimadoEn) {
    return;
  }

  const inicio = new Date(inicioEstimadoEn);

  if (
    Number.isNaN(inicio.getTime()) ||
    getOperationalDate(inicio, timezone) !==
      fechaOperativa ||
    inicio < now
  ) {
    throw new BusinessRuleError(
      'El inicio estimado debe pertenecer a la fecha operativa actual y no puede estar en el pasado',
      'INICIO_ESTIMADO_INVALIDO',
    );
  }
};

const calcularEstimacionesPlan = ({
  plan,
  inicioEstimadoEn,
  config,
}) => {
  const totalEntregas = Array.isArray(plan.entregas)
    ? plan.entregas.length
    : 0;
  const duracionOperativaMin =
    calcularDuracionOperativaMin({
      tiempoViajeMin: plan.tiempo_estimado_min,
      totalEntregas,
      tiempoServicioPorEntregaMin:
        config.tiempoServicioPorEntregaMin,
      margenOperativoPorcentaje:
        config.margenOperativoPorcentaje,
    });
  const retornoEstimadoEn =
    agregarMinutosOperativos(
      inicioEstimadoEn,
      duracionOperativaMin,
      config.minutosMaximosOperacionDia,
      {
        timezone: config.timezone,
        horaInicioOperacion:
          config.horaInicioOperacion,
      },
    );
  const entregasEstimadas = new Map(
    (plan.entregas || []).map((entrega) => [
      Number(entrega.pedido_id),
      calcularEntregaEstimada({
        inicio: inicioEstimadoEn,
        tiempoAcumuladoMin:
          entrega.tiempo_acumulado_min,
        ordenEntrega: entrega.orden_entrega,
        tiempoServicioPorEntregaMin:
          config.tiempoServicioPorEntregaMin,
        margenOperativoPorcentaje:
          config.margenOperativoPorcentaje,
        minutosMaximosOperacionDia:
          config.minutosMaximosOperacionDia,
        timezone: config.timezone,
        horaInicioOperacion:
          config.horaInicioOperacion,
      }),
    ]),
  );

  return {
    duracionOperativaMin,
    retornoEstimadoEn,
    entregasEstimadas,
  };
};

const validarChoferDisponible = (
  chofer,
) => {
  if (
    !chofer ||
    !chofer.activo ||
    chofer.usuario?.rol !== ROLES.CHOFER ||
    chofer.usuario?.estado === false
  ) {
    throw new BusinessRuleError(
      'El chofer no está disponible para planificación',
      'CHOFER_NO_DISPONIBLE',
    );
  }

  if (
    licenciaVencida(
      chofer.fecha_vencimiento_licencia,
    )
  ) {
    throw new BusinessRuleError(
      'La licencia del chofer está vencida',
      'CHOFER_NO_DISPONIBLE',
    );
  }
};

const obtenerChoferesDisponibles = async ({
  fechaOperativa,
}) => {
  const jornadasOcupantes =
    await JornadaReparto.findAll({
      where: {
        chofer_id: {
          [Op.ne]: null,
        },
        [Op.or]: [
          {
            fecha: fechaOperativa,
            estado: {
              [Op.in]: ESTADOS_JORNADA_ACTIVA,
            },
          },
          {
            estado: 'EN_RUTA',
          },
        ],
      },
      attributes: ['chofer_id'],
    });
  const ocupados = jornadasOcupantes.map(
    (jornada) => Number(jornada.chofer_id),
  );
  const where = {
    activo: true,
  };

  if (ocupados.length) {
    where.id = {
      [Op.notIn]: ocupados,
    };
  }

  const choferes = await Chofer.findAll({
    where,
    include: [
      {
        model: Usuario,
        as: 'usuario',
      },
    ],
    order: [['id', 'ASC']],
  });

  return choferes.filter((chofer) => {
    try {
      validarChoferDisponible(chofer);
      return true;
    } catch {
      return false;
    }
  });
};

const obtenerDestinoPedido = (pedido) =>
  Number(pedido.cliente.ubicacion.id);

const obtenerCapacidadCamion = (camion) => {
  const capacidad = Number(camion.capacidad);

  if (!Number.isInteger(capacidad) || capacidad <= 0) {
    throw new BusinessRuleError(
      'El camión no tiene una capacidad válida configurada',
    );
  }

  return capacidad;
};

const licenciaVencida = (fecha) => {
  const vencimiento = new Date(`${fecha}T23:59:59`);

  return Number.isNaN(vencimiento.getTime()) ||
    vencimiento < new Date();
};

const assertChoferAsignado = (
  jornada,
  user,
) => {
  if (isAdmin(user)) {
    return;
  }

  if (user?.rol !== ROLES.CHOFER) {
    throw new ForbiddenError(
      'Solo el chofer asignado puede operar la jornada',
      'JORNADA_OPERACION_DENEGADA',
    );
  }

  const usuarioChoferId =
    jornada.chofer?.usuario_id ??
    jornada.chofer?.usuario?.id;

  if (
    Number(usuarioChoferId) !==
    Number(user.id)
  ) {
    throw new ForbiddenError(
      'No puede operar una jornada asignada a otro chofer',
      'JORNADA_AJENA',
    );
  }
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
    throw new BusinessRuleError(
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
    const pedido = despacho.pedido;
    const cliente = pedido?.cliente;
    const ubicacion = cliente?.ubicacion;

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
    chofer_id: jornada.chofer_id,
    fecha: jornada.fecha,
    inicio_estimado_en:
      jornada.inicio_estimado_en,
    retorno_estimado_en:
      jornada.retorno_estimado_en,
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


export const generarJornadaReparto = async (
  options = {},
) => {
  const config = getLogisticTimeConfig();
  const now = options.now || new Date();
  const fechaJornada = validarFechaOperativa({
    fechaSolicitada: options.fecha,
    now,
    timezone: config.timezone,
  });

  validarInicioEstimadoSolicitado({
    inicioEstimadoEn: options.inicio_estimado_en,
    fechaOperativa: fechaJornada,
    now,
    timezone: config.timezone,
  });

  const inicioEstimadoEn =
    resolveInicioEstimado({
      fechaOperativa: fechaJornada,
      now,
      inicioEstimadoEn:
        options.inicio_estimado_en,
      timezone: config.timezone,
      horaInicioOperacion:
        config.horaInicioOperacion,
    });

  const pedidos = await Pedido.findAll({
    where: {
      estado: 'LISTO_PARA_DESPACHO',
      '$despachos.id$': null,
    },
    include: [
      {
        model: Cliente,
        as: 'cliente',
        required: true,
        include: [
          {
            model: Ubicacion,
            as: 'ubicacion',
            required: true,
          },
        ],
      },
      {
        model: DetallePedido,
        as: 'detalles',
        required: true,
        attributes: ['id'],
      },
      {
        model: Despacho,
        as: 'despachos',
        required: false,
        where: {
          estado: {
            [Op.in]: [
              'PENDIENTE',
              'EN_TRANSITO',
            ],
          },
        },
        attributes: ['id'],
      },
    ],
    order: [['id', 'ASC']],
  });

  if (!pedidos.length) {
    throw new BusinessRuleError(
      'No existen pedidos listos para despacho',
      'PEDIDOS_NO_DISPONIBLES',
    );
  }

  const pedidosElegibles = pedidos.filter(
    (pedido) =>
      pedido.cliente?.ubicacion?.latitud !== null &&
      pedido.cliente?.ubicacion?.latitud !== undefined &&
      pedido.cliente?.ubicacion?.longitud !== null &&
      pedido.cliente?.ubicacion?.longitud !== undefined,
  );

  if (!pedidosElegibles.length) {
    throw new BusinessRuleError(
      'No existen pedidos elegibles con ubicación y coordenadas válidas',
      'PEDIDOS_NO_DISPONIBLES',
    );
  }

  /*
   * Un camión EN_BODEGA no necesariamente está disponible:
   * puede tener una jornada PLANIFICADA en la misma fecha.
   */
  const jornadasActivas = await JornadaReparto.findAll({
    where: {
      [Op.or]: [
        {
          fecha: fechaJornada,
          estado: {
            [Op.in]: ESTADOS_JORNADA_ACTIVA,
          },
        },
        {
          estado: 'EN_RUTA',
        },
      ],
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
    throw new BusinessRuleError(
      'No existen camiones disponibles con capacidad válida',
      'CAMIONES_NO_DISPONIBLES',
    );
  }

  const choferesDisponibles =
    await obtenerChoferesDisponibles({
      fechaOperativa: fechaJornada,
    });

  if (!choferesDisponibles.length) {
    throw new BusinessRuleError(
      'No existen choferes disponibles para generar jornadas',
      'CHOFERES_NO_DISPONIBLES',
    );
  }

  const camionesSeleccionados = camiones.slice(
    0,
    choferesDisponibles.length,
  );

  const bodega = await Ubicacion.findByPk(
    BODEGA_CENTRAL_ID,
  );

  if (!bodega) {
    throw new BusinessRuleError(
      'No se encontró la bodega central',
    );
  }

  if (
    bodega.latitud === null ||
    bodega.longitud === null
  ) {
    throw new BusinessRuleError(
      'La bodega central no tiene coordenadas registradas',
    );
  }

  const rutas = await Ruta.findAll({
    where: {
      estado: true,
    },
  });

  if (!rutas.length) {
    throw new BusinessRuleError(
      'No existen rutas activas para calcular las jornadas',
    );
  }

  /*
   * Se envían todos los pedidos y todos los camiones.
   * Python decide cuántas jornadas conviene crear.
   */
  const resultado =
    await logisticaService.generarPlanJornada({
      pedidos: pedidosElegibles,
      camiones: camionesSeleccionados,
      bodega,
      rutas,
    });

  if (
    !resultado ||
    !Array.isArray(resultado.jornadas) ||
    !Array.isArray(resultado.pedidos_no_asignados)
  ) {
    throw new BusinessRuleError(
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

  const jornadasCreadas = [];
  const eventosJornadaCreada = [];

  await sequelize.transaction(
    async (transaction) => {
      if (
        getOperationalDate(
          new Date(),
          config.timezone,
        ) !== fechaJornada
      ) {
        throw new BusinessRuleError(
          'La fecha operativa cambió durante la generación de jornadas',
          'GENERACION_FUERA_DE_FECHA_OPERATIVA',
        );
      }

      const pedidosProcesados = new Set();
      const camionesProcesados = new Set();

      for (const plan of resultado.jornadas) {
        if (
          !plan ||
        !plan.camion_id ||
        !Array.isArray(plan.entregas) ||
        !plan.entregas.length
        ) {
          continue;
        }

        const camionId = Number(plan.camion_id);
        const choferAsignado =
          choferesDisponibles[
            camionesProcesados.size
          ];

        if (camionesProcesados.has(camionId)) {
          throw new BusinessRuleError(
            `El camión ${camionId} fue asignado a más de una jornada`,
          );
        }

        if (!choferAsignado) {
          throw new BusinessRuleError(
            'No existen choferes suficientes para persistir todas las jornadas planificadas',
            'CHOFERES_NO_DISPONIBLES',
          );
        }

        camionesProcesados.add(camionId);

        /*
       * Evita que Python asigne accidentalmente
       * el mismo pedido a dos jornadas.
        */
        const pedidoIdsPlan = [];
        const ordenesPlan = new Set();

        for (const entrega of plan.entregas) {
          const pedidoId = Number(entrega.pedido_id);
          const ordenEntrega = Number(
            entrega.orden_entrega,
          );

          if (pedidosProcesados.has(pedidoId)) {
            throw new BusinessRuleError(
              `El pedido ${pedidoId} fue asignado a más de una jornada`,
            );
          }

          if (ordenesPlan.has(ordenEntrega)) {
            throw new BusinessRuleError(
              `La jornada del camión ${camionId} contiene órdenes de entrega duplicados`,
              'ORDEN_ENTREGA_DUPLICADO',
            );
          }

          pedidosProcesados.add(pedidoId);
          ordenesPlan.add(ordenEntrega);
          pedidoIdsPlan.push(pedidoId);
        }

        const pedidosBloqueados = await Pedido.findAll({
          where: {
            id: {
              [Op.in]: pedidoIdsPlan,
            },
            estado: 'LISTO_PARA_DESPACHO',
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (pedidosBloqueados.length !== pedidoIdsPlan.length) {
          throw new BusinessRuleError(
            'Uno o más pedidos ya no están disponibles para despacho',
          );
        }

        const despachosActivos = await Despacho.findAll({
          where: {
            pedido_id: {
              [Op.in]: pedidoIdsPlan,
            },
            estado: {
              [Op.in]: [
                'PENDIENTE',
                'EN_TRANSITO',
              ],
            },
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (despachosActivos.length) {
          throw new BusinessRuleError(
            'Uno o más pedidos ya poseen un despacho activo',
          );
        }

        const camion = await Camion.findByPk(camionId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (
          !camion ||
        camion.estado !== 'EN_BODEGA' ||
        Number(camion.capacidad) <= 0
        ) {
          throw new BusinessRuleError(
            `El camión ${camionId} ya no está disponible`,
          );
        }

        const jornadaActivaCamion =
        await JornadaReparto.findOne({
          where: construirWhereConflictoRecurso({
            fecha: fechaJornada,
            camionId,
          }),
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (jornadaActivaCamion) {
          throw new BusinessRuleError(
            `El camión ${camionId} ya posee una jornada activa para la fecha ${fechaJornada}`,
            'CAMION_NO_DISPONIBLE',
          );
        }

        const chofer = await Chofer.findByPk(
          choferAsignado.id,
          {
            include: [
              {
                model: Usuario,
                as: 'usuario',
              },
            ],
            transaction,
            lock: transaction.LOCK.UPDATE,
          },
        );

        validarChoferDisponible(chofer);

        const jornadaActivaChofer =
          await JornadaReparto.findOne({
            where: construirWhereConflictoRecurso({
              fecha: fechaJornada,
              choferId: chofer.id,
            }),
            transaction,
            lock: transaction.LOCK.UPDATE,
          });

        if (jornadaActivaChofer) {
          throw new BusinessRuleError(
            `El chofer ${chofer.id} ya posee una jornada activa o en ruta`,
            'CHOFER_NO_DISPONIBLE',
          );
        }

        const estimaciones =
          calcularEstimacionesPlan({
            plan,
            inicioEstimadoEn,
            config,
          });

        const jornada = await JornadaReparto.create(
          {
            camion_id: plan.camion_id,
            chofer_id: chofer.id,
            fecha: fechaJornada,
            inicio_estimado_en:
              inicioEstimadoEn,
            retorno_estimado_en:
              estimaciones.retornoEstimadoEn,
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
           * Invariante:
           * Un pedido planificado continúa LISTO_PARA_DESPACHO
           * hasta que el chofer inicia físicamente la jornada.
           */

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
                estimaciones.entregasEstimadas.get(
                  pedidoId,
                ) ||
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

        eventosJornadaCreada.push({
          jornada,
          despachos: despachosCreados,
        });
      }

      if (!jornadasCreadas.length) {
        throw new BusinessRuleError(
          'La planificación no produjo jornadas persistibles',
        );
      }
    },
  );

  /*
   * n8n siempre después del commit.
   * Un fallo de notificación no revierte la planificación.
   */
  for (const item of eventosJornadaCreada) {
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

export const iniciarJornada = async (
  id,
  user,
) => {
  const config = getLogisticTimeConfig();

  const jornadaId = await sequelize.transaction(
    async (transaction) => {
      const jornada = await JornadaReparto.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!jornada) {
        throw new NotFoundError(
          'Jornada de reparto no encontrada',
          'JORNADA_NO_ENCONTRADA',
        );
      }

      if (jornada.estado !== 'PLANIFICADA') {
        throw new BusinessRuleError(
          'Solo se puede iniciar una jornada en estado PLANIFICADA',
          jornada.estado === 'EN_RUTA'
            ? 'JORNADA_YA_INICIADA'
            : 'JORNADA_ESTADO_INVALIDO_INICIO',
        );
      }

      const chofer = jornada.chofer_id
        ? await Chofer.findByPk(
          jornada.chofer_id,
          {
            include: [
              {
                model: Usuario,
                as: 'usuario',
              },
            ],
            transaction,
            lock: transaction.LOCK.UPDATE,
          },
        )
        : null;

      if (!chofer) {
        throw new BusinessRuleError(
          'La jornada no tiene chofer asignado',
          'JORNADA_SIN_CHOFER',
        );
      }

      if (!chofer.activo) {
        throw new BusinessRuleError(
          'El chofer asignado está inactivo',
          'CHOFER_INACTIVO',
        );
      }

      if (
        chofer.usuario?.rol !== ROLES.CHOFER ||
        chofer.usuario?.estado === false
      ) {
        throw new BusinessRuleError(
          'El usuario del chofer no está activo como CHOFER',
          'USUARIO_CHOFER_INVALIDO',
        );
      }

      if (
        licenciaVencida(
          chofer.fecha_vencimiento_licencia,
        )
      ) {
        throw new BusinessRuleError(
          'La licencia del chofer está vencida',
          'LICENCIA_VENCIDA',
        );
      }

      assertChoferAsignado(
        {
          ...jornada.toJSON(),
          chofer,
        },
        user,
      );

      const jornadaActivaChofer =
        await JornadaReparto.findOne({
          where: construirWhereConflictoRecurso({
            fecha: jornada.fecha,
            excluirJornadaId: jornada.id,
            choferId: chofer.id,
          }),
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

      if (jornadaActivaChofer) {
        throw new BusinessRuleError(
          'El chofer ya posee otra jornada activa en la misma fecha',
          'CHOFER_NO_DISPONIBLE',
        );
      }

      const jornadaActivaCamion =
        await JornadaReparto.findOne({
          where: construirWhereConflictoRecurso({
            fecha: jornada.fecha,
            excluirJornadaId: jornada.id,
            camionId: jornada.camion_id,
          }),
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

      if (jornadaActivaCamion) {
        throw new BusinessRuleError(
          'El camión ya posee otra jornada activa en la misma fecha',
          'CAMION_NO_DISPONIBLE',
        );
      }

      if (!jornada.carga_confirmada_en) {
        throw new BusinessRuleError(
          'La jornada requiere carga confirmada antes de iniciar',
          'JORNADA_SIN_CARGA_CONFIRMADA',
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
        throw new BusinessRuleError(
          'El camión asociado a la jornada no existe',
        );
      }

      if (camion.estado !== 'EN_BODEGA') {
        throw new BusinessRuleError(
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
        throw new BusinessRuleError(
          'La jornada no posee despachos asignados',
        );
      }

      const despachoNoCargado = despachos.find(
        (despacho) => !despacho.cargado,
      );

      if (despachoNoCargado) {
        throw new BusinessRuleError(
          'Todos los despachos deben estar cargados antes de iniciar la jornada',
          'DESPACHOS_CARGA_INCOMPLETA',
        );
      }

      const despachoNoPendiente = despachos.find(
        (despacho) =>
          despacho.estado !== 'PENDIENTE',
      );

      if (despachoNoPendiente) {
        throw new BusinessRuleError(
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
        throw new BusinessRuleError(
          'Los despachos no tienen un orden de entrega válido',
        );
      }

      const primerOrden = Math.min(...ordenes);
      const fechaSalida = new Date();
      const estimacionesInicio =
        calcularEstimacionesPlan({
          plan: {
            tiempo_estimado_min:
              jornada.tiempo_estimado,
            entregas: despachos.map(
              (despacho) => ({
                pedido_id: despacho.pedido_id,
                orden_entrega:
                  despacho.orden_entrega,
                tiempo_acumulado_min:
                  despacho.tiempo_estimado,
              }),
            ),
          },
          inicioEstimadoEn: fechaSalida,
          config,
        });

      await jornada.update(
        {
          estado: 'EN_RUTA',
          fecha_salida: fechaSalida,
          retorno_estimado_en:
            estimacionesInicio
              .retornoEstimadoEn,
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
        throw new BusinessRuleError(
          'No fue posible iniciar todos los despachos de la jornada',
        );
      }

      for (const despacho of despachos) {
        const fechaEstimadaEntrega =
          estimacionesInicio
            .entregasEstimadas
            .get(Number(despacho.pedido_id));

        if (fechaEstimadaEntrega) {
          await despacho.update(
            {
              fecha_estimada_entrega:
                fechaEstimadaEntrega,
            },
            {
              transaction,
            },
          );
        }
      }

      const pedidoIds = despachos.map(
        (despacho) => despacho.pedido_id,
      );

      /*
       * Invariante:
       * DESPACHADO representa salida física de la ruta,
       * no la planificación logística.
       */
      const [pedidosActualizados] =
        await Pedido.update(
          {
            estado: 'DESPACHADO',
          },
          {
            where: {
              id: {
                [Op.in]: pedidoIds,
              },
              estado: {
                [Op.in]: [
                  'LISTO_PARA_DESPACHO',
                  'DESPACHADO',
                ],
              },
            },
            transaction,
          },
        );

      if (
        pedidosActualizados !==
        pedidoIds.length
      ) {
        throw new BusinessRuleError(
          'Uno o más pedidos no están listos para iniciar la ruta',
          'PEDIDOS_ESTADO_INVALIDO_INICIO',
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
              as: 'pedido',
              include: [
                {
                  model: Cliente,
                  as: 'cliente',
                  include: [
                    {
                      model: Ubicacion,
                      as: 'ubicacion',
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
    throw new BusinessRuleError(
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

export const avanzarJornada = async (
  id,
  user,
) => {
  const jornada = await JornadaReparto.findByPk(id, {
    include: [
      {
        model: Chofer,
        as: 'chofer',
        required: false,
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: [
              'id',
              'rol',
              'estado',
            ],
          },
        ],
      },
      {
        model: Despacho,
        as: 'despachos',
      },
    ],
  });

  if (!jornada) {
    throw new NotFoundError(
      'Jornada de reparto no encontrada',
      'JORNADA_NO_ENCONTRADA',
    );
  }

  assertChoferAsignado(
    jornada.toJSON(),
    user,
  );

  if (jornada.estado !== 'EN_RUTA') {
    throw new BusinessRuleError('Solo se puede avanzar una jornada en estado EN_RUTA');
  }

  const posicionActual = Number(jornada.posicion_actual_orden);

  const despachosPuntoActual = jornada.despachos.filter(
    (despacho) => Number(despacho.orden_entrega) === posicionActual,
  );

  if (!despachosPuntoActual.length) {
    throw new BusinessRuleError('No existen despachos para la posición actual de la jornada');
  }

  const todosCerrados = despachosPuntoActual.every((despacho) =>
    ['ENTREGADO', 'NO_ENTREGADO'].includes(despacho.estado),
  );

  if (!todosCerrados) {
    throw new BusinessRuleError(
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
    throw new BusinessRuleError('La jornada ya no tiene más puntos pendientes por recorrer');
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

export const asignarChofer = async (
  id,
  choferId,
) => {
  const jornadaId = await sequelize.transaction(
    async (transaction) => {
      const jornada = await JornadaReparto.findByPk(
        id,
        {
          transaction,
          lock: transaction.LOCK.UPDATE,
        },
      );

      if (!jornada) {
        throw new NotFoundError(
          'Jornada de reparto no encontrada',
          'JORNADA_NO_ENCONTRADA',
        );
      }

      if (jornada.estado !== 'PLANIFICADA') {
        throw new BusinessRuleError(
          'Solo se puede asignar chofer a una jornada PLANIFICADA',
          'JORNADA_ESTADO_INVALIDO_CHOFER',
        );
      }

      const chofer = await Chofer.findByPk(
        choferId,
        {
          include: [
            {
              model: Usuario,
              as: 'usuario',
            },
          ],
          transaction,
          lock: transaction.LOCK.UPDATE,
        },
      );

      if (!chofer) {
        throw new NotFoundError(
          'Chofer no encontrado',
          'CHOFER_NO_ENCONTRADO',
        );
      }

      if (
        !chofer.activo ||
        chofer.usuario?.rol !== ROLES.CHOFER ||
        chofer.usuario?.estado === false
      ) {
        throw new BusinessRuleError(
          'El chofer no está activo o no tiene rol CHOFER',
          'CHOFER_NO_ASIGNABLE',
        );
      }

      if (
        licenciaVencida(
          chofer.fecha_vencimiento_licencia,
        )
      ) {
        throw new BusinessRuleError(
          'La licencia del chofer está vencida',
          'LICENCIA_VENCIDA',
        );
      }

      const jornadaActiva =
        await JornadaReparto.findOne({
          where: construirWhereConflictoRecurso({
            fecha: jornada.fecha,
            excluirJornadaId: jornada.id,
            choferId: chofer.id,
          }),
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

      if (jornadaActiva) {
        throw new BusinessRuleError(
          'El chofer ya tiene una jornada activa en la misma fecha',
          'CHOFER_NO_DISPONIBLE',
        );
      }

      await jornada.update(
        {
          chofer_id: chofer.id,
        },
        {
          transaction,
        },
      );

      return jornada.id;
    },
  );

  return obtenerJornadaPorId(jornadaId);
};

export const finalizarJornada = async (
  id,
  user,
) => {
  const jornadaId = await sequelize.transaction(
    async (transaction) => {
      const jornada = await JornadaReparto.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!jornada) {
        throw new NotFoundError(
          'Jornada de reparto no encontrada',
          'JORNADA_NO_ENCONTRADA',
        );
      }

      if (jornada.estado !== 'EN_RUTA') {
        throw new BusinessRuleError(
          'Solo se puede finalizar una jornada en estado EN_RUTA',
        );
      }

      const chofer = jornada.chofer_id
        ? await Chofer.findByPk(
          jornada.chofer_id,
          {
            include: [
              {
                model: Usuario,
                as: 'usuario',
              },
            ],
            transaction,
            lock: transaction.LOCK.UPDATE,
          },
        )
        : null;

      assertChoferAsignado(
        {
          ...jornada.toJSON(),
          chofer,
        },
        user,
      );

      const camion = await Camion.findByPk(
        jornada.camion_id,
        {
          transaction,
          lock: transaction.LOCK.UPDATE,
        },
      );

      if (!camion) {
        throw new BusinessRuleError(
          'El camión asociado a la jornada no existe',
        );
      }

      if (camion.estado !== 'EN_RUTA') {
        throw new BusinessRuleError(
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
        throw new BusinessRuleError(
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
        throw new BusinessRuleError(
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
          throw new BusinessRuleError(
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
              as: 'pedido',
              include: [
                {
                  model: Cliente,
                  as: 'cliente',
                  include: [
                    {
                      model: Ubicacion,
                      as: 'ubicacion',
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
    throw new BusinessRuleError(
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

export const obtenerJornadas = async (user) => {
  const where = {};

  if (user?.rol === ROLES.CHOFER) {
    const chofer = await Chofer.findOne({
      where: {
        usuario_id: user.id,
      },
    });

    where.chofer_id = chofer?.id ?? null;
  }

  const jornadas = await JornadaReparto.findAll({
    where,
    attributes: [
      'id',
      'camion_id',
      'chofer_id',
      'carga_confirmada_en',
      'fecha',
      'inicio_estimado_en',
      'retorno_estimado_en',
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
        model: Chofer,
        as: 'chofer',
        required: false,
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: [
              'id',
              'nombre',
              'apellido',
              'correo',
              'rol',
            ],
          },
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
          'cargado',
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
    const atraso = derivarAtrasoJornada(
      plain,
    );

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
      inicio_estimado_en:
        plain.inicio_estimado_en,
      retorno_estimado_en:
        plain.retorno_estimado_en,
      fecha_salida: plain.fecha_salida,
      fecha_finalizacion:
        plain.fecha_finalizacion,
      atrasada: atraso.atrasada,
      minutos_retraso:
        atraso.minutos_retraso,
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
      chofer: plain.chofer,
      carga_confirmada:
        Boolean(plain.carga_confirmada_en),

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

export const obtenerJornadaPorId = async (
  id,
  user,
) => {
  const jornada = await JornadaReparto.findByPk(id, {
    include: [
      {
        model: Camion,
        as: 'camion',
      },
      {
        model: Chofer,
        as: 'chofer',
        required: false,
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: [
              'id',
              'nombre',
              'apellido',
              'correo',
              'rol',
            ],
          },
        ],
      },
      {
        model: Despacho,
        as: 'despachos',
        include: [
          {
            model: Pedido,
            as: 'pedido',
            include: [
              {
                model: Cliente,
                as: 'cliente',
                include: [
                  {
                    model: Ubicacion,
                    as: 'ubicacion',
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
    throw new NotFoundError(
      'Jornada de reparto no encontrada',
      'JORNADA_NO_ENCONTRADA',
    );
  }

  if (user?.rol === ROLES.CHOFER) {
    assertChoferAsignado(jornada.toJSON(), user);
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
    ...derivarAtrasoJornada(jornadaJson),
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
            as: 'pedido',
            include: [
              {
                model: Cliente,
                as: 'cliente',
                include: [
                  {
                    model: Ubicacion,
                    as: 'ubicacion',
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
    throw new NotFoundError(
      'Jornada de reparto no encontrada',
      'JORNADA_NO_ENCONTRADA',
    );
  }

  /*
   * =====================================================
   * 2. Validaciones de negocio
   * =====================================================
   */

  if (jornada.estado !== 'PLANIFICADA') {
    throw new BusinessRuleError(
      'Solo se puede recalcular una jornada PLANIFICADA',
    );
  }

  if (!jornada.camion) {
    throw new BusinessRuleError(
      'La jornada no tiene un camión asociado',
    );
  }

  if (jornada.camion.estado !== 'EN_BODEGA') {
    throw new BusinessRuleError(
      'Solo se puede recalcular si el camión está EN_BODEGA',
    );
  }

  if (!jornada.despachos.length) {
    throw new BusinessRuleError(
      'La jornada no posee despachos para recalcular',
    );
  }

  const tieneDespachosNoPendientes =
    jornada.despachos.some(
      (despacho) => despacho.estado !== 'PENDIENTE',
    );

  if (tieneDespachosNoPendientes) {
    throw new BusinessRuleError(
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
    throw new BusinessRuleError(
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
        as: 'cliente',
        include: [
          {
            model: Ubicacion,
            as: 'ubicacion',
          },
        ],
      },
    ],
    order: [['id', 'ASC']],
  });

  if (!nuevosPedidos.length) {
    throw new BusinessRuleError(
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
    (despacho) => despacho.pedido,
  );

  const pedidosActualesIds = new Set(
    pedidosActuales.map(
      (pedido) => Number(pedido.id),
    ),
  );

  const destinosActuales = new Map();
  const ordenesUsadas = new Set();

  for (const despacho of jornada.despachos) {
    const pedido = despacho.pedido;

    if (
      !pedido ||
      !pedido.cliente ||
      !pedido.cliente.ubicacion
    ) {
      throw new BusinessRuleError(
        `El despacho ${despacho.id} no posee una ubicación válida`,
      );
    }

    const destinoId = obtenerDestinoPedido(
      pedido,
    );
    const ordenEntrega = Number(
      despacho.orden_entrega,
    );

    if (Number.isFinite(ordenEntrega)) {
      ordenesUsadas.add(ordenEntrega);
    }

    /*
     * Guardamos un despacho como referencia del punto.
     * La fase de integridad impide compartir orden dentro
     * de la misma jornada; se valida antes de persistir.
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
      !pedido.cliente ||
      !pedido.cliente.ubicacion
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
      const ordenReferencia = Number(
        despachoReferencia.orden_entrega,
      );

      if (
        !Number.isInteger(ordenReferencia) ||
        ordenReferencia <= 0 ||
        ordenesUsadas.has(ordenReferencia)
      ) {
        throw new BusinessRuleError(
          'La recalculación produciría un orden de entrega duplicado',
          'ORDEN_ENTREGA_DUPLICADO',
        );
      }

      /*
       * Caso A:
       * El camión ya pasa por esa ubicación.
       */
      incorporadosDirectos.push({
        pedido,
        despachoReferencia,
      });
      ordenesUsadas.add(ordenReferencia);
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
    throw new BusinessRuleError(
      'No se encontró la bodega central',
    );
  }

  if (
    bodega.latitud === null ||
    bodega.longitud === null
  ) {
    throw new BusinessRuleError(
      'La bodega central no tiene coordenadas registradas',
    );
  }

  const rutas = await Ruta.findAll({
    where: {
      estado: true,
    },
  });

  if (!rutas.length) {
    throw new BusinessRuleError(
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
      throw new BusinessRuleError(
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
      throw new BusinessRuleError(
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
      throw new BusinessRuleError(
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
      throw new BusinessRuleError(
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

  const config = getLogisticTimeConfig();
  const inicioBaseEstimacion =
    jornada.inicio_estimado_en
      ? new Date(jornada.inicio_estimado_en)
      : resolveInicioEstimado({
        fechaOperativa: jornada.fecha,
        now: new Date(),
        timezone: config.timezone,
        horaInicioOperacion:
          config.horaInicioOperacion,
      });
  const estimacionesRecalculo =
    resultadoPlanificado
      ? calcularEstimacionesPlan({
        plan: resultadoPlanificado,
        inicioEstimadoEn:
          inicioBaseEstimacion,
        config,
      })
      : null;

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
          inicio_estimado_en:
            inicioBaseEstimacion,
          retorno_estimado_en:
            estimacionesRecalculo
              .retornoEstimadoEn,
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

        const estadosPermitidos =
          pedidosActualesIds.has(pedidoId)
            ? [
              'LISTO_PARA_DESPACHO',
              'DESPACHADO',
            ]
            : ['LISTO_PARA_DESPACHO'];

        const pedidoVigente =
          await Pedido.findOne({
            where: {
              id: pedidoId,
              estado: {
                [Op.in]:
                  estadosPermitidos,
              },
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
          });

        if (!pedidoVigente) {
          throw new BusinessRuleError(
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
            fecha_estimada_entrega:
              estimacionesRecalculo
                .entregasEstimadas
                .get(pedidoId) ||
              entrega.fecha_estimada_entrega ||
              null,
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

        const pedidoVigente =
          await Pedido.findOne({
            where: {
              id: pedido.id,
              estado:
                'LISTO_PARA_DESPACHO',
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
          });

        if (!pedidoVigente) {
          throw new BusinessRuleError(
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
            pedido.cliente.nombre,
          destino_id:
            pedido.cliente.ubicacion.id,
          ubicacion:
            pedido.cliente.ubicacion
              .nombre,
          latitud: Number(
            pedido.cliente.ubicacion
              .latitud,
          ),
          longitud: Number(
            pedido.cliente.ubicacion
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
          inicio_estimado_en:
            inicioBaseEstimacion,
          retorno_estimado_en:
            agregarMinutosOperativos(
              inicioBaseEstimacion,
              calcularDuracionOperativaMin({
                tiempoViajeMin:
                  jornada.tiempo_estimado,
                totalEntregas:
                  jornada.despachos.length +
                  incorporadosDirectos.length,
                tiempoServicioPorEntregaMin:
                  config
                    .tiempoServicioPorEntregaMin,
                margenOperativoPorcentaje:
                  config
                    .margenOperativoPorcentaje,
              }),
              config.minutosMaximosOperacionDia,
              {
                timezone: config.timezone,
                horaInicioOperacion:
                  config.horaInicioOperacion,
              },
            ),
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

export const obtenerMapaGeneral = async (user) => {
  if (
    user &&
    !hasPermission(
      user.rol,
      PERMISSIONS.JORNADAS_MAPA_GENERAL,
    )
  ) {
    throw new ForbiddenError(
      'No puede consultar el mapa operativo general',
      'MAPA_GENERAL_JORNADAS_DENEGADO',
    );
  }

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
            as: 'pedido',
            attributes: [
              'id',
              'cliente_id',
              'estado',
              'fecha_entrega',
            ],

            include: [
              {
                model: Cliente,
                as: 'cliente',
                attributes: [
                  'id',
                  'nombre',
                  'direccion',
                ],

                include: [
                  {
                    model: Ubicacion,
                    as: 'ubicacion',
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

