import { Op } from 'sequelize';

import db from '../models/index.js';
import {
  NotFoundError,
} from '../utils/errors.js';

const {
  Camion,
  JornadaReparto,
  Despacho,
} = db;

/*
|--------------------------------------------------------------------------
| Constantes
|--------------------------------------------------------------------------
*/

const ESTADOS_JORNADA_ACTIVA = [
  'PLANIFICADA',
  'EN_RUTA',
];

/*
|--------------------------------------------------------------------------
| Formateadores
|--------------------------------------------------------------------------
*/

const formatearCodigoCamion = (camion) => {
  if (camion.codigo) {
    return camion.codigo;
  }

  return `CAM-${String(camion.id).padStart(3, '0')}`;
};

const formatearCodigoJornada = (jornada) => {
  if (!jornada) {
    return null;
  }

  if (jornada.codigo) {
    return jornada.codigo;
  }

  return `JR-${String(jornada.id).padStart(5, '0')}`;
};

/*
|--------------------------------------------------------------------------
| Selección de jornada vigente
|--------------------------------------------------------------------------
|
| Un camión debería tener como máximo una jornada activa.
| Aun así, el servicio se protege ante datos inconsistentes:
|
| 1. Prioriza EN_RUTA.
| 2. Luego PLANIFICADA.
| 3. Si hay varias, toma la de mayor ID.
|--------------------------------------------------------------------------
*/

const obtenerJornadaVigente = (jornadas = []) => {
  if (!Array.isArray(jornadas) || jornadas.length === 0) {
    return null;
  }

  return [...jornadas].sort((a, b) => {
    const prioridadEstado = {
      EN_RUTA: 2,
      PLANIFICADA: 1,
    };

    const prioridadA =
      prioridadEstado[a.estado] ?? 0;

    const prioridadB =
      prioridadEstado[b.estado] ?? 0;

    if (prioridadA !== prioridadB) {
      return prioridadB - prioridadA;
    }

    return Number(b.id) - Number(a.id);
  })[0];
};

/*
|--------------------------------------------------------------------------
| Transformación de respuesta
|--------------------------------------------------------------------------
*/

const construirResumenCamion = (camion) => {
  const camionJson = camion.toJSON
    ? camion.toJSON()
    : camion;

  const jornadaVigente = obtenerJornadaVigente(
    camionJson.jornadas,
  );

  const despachos = Array.isArray(
    jornadaVigente?.despachos,
  )
    ? jornadaVigente.despachos
    : [];

  const capacidadMaxima = Number(
    camionJson.capacidad,
  );

  const pedidosAsignados = despachos.length;

  const capacidadDisponible = Number.isFinite(
    capacidadMaxima,
  )
    ? Math.max(
      capacidadMaxima - pedidosAsignados,
      0,
    )
    : 0;

  const porcentajeOcupacion =
    capacidadMaxima > 0
      ? Math.min(
        Math.round(
          (pedidosAsignados /
            capacidadMaxima) *
            100,
        ),
        100,
      )
      : 0;

  return {
    id: camionJson.id,

    codigo: formatearCodigoCamion(
      camionJson,
    ),

    placa: camionJson.placa,

    capacidad: capacidadMaxima,

    estado: camionJson.estado,

    pedidos_asignados:
      pedidosAsignados,

    capacidad_disponible:
      capacidadDisponible,

    porcentaje_ocupacion:
      porcentajeOcupacion,

    capacidad_completa:
      capacidadMaxima > 0 &&
      pedidosAsignados >= capacidadMaxima,

    tiene_jornada:
      Boolean(jornadaVigente),

    jornada: jornadaVigente
      ? {
        id: jornadaVigente.id,

        codigo:
            formatearCodigoJornada(
              jornadaVigente,
            ),

        estado:
            jornadaVigente.estado,

        posicion_actual_orden:
            Number(
              jornadaVigente
                .posicion_actual_orden ??
                0,
            ),

        distancia_total:
            Number(
              jornadaVigente
                .distancia_total ??
                0,
            ),

        tiempo_estimado:
            Number(
              jornadaVigente
                .tiempo_estimado ??
                0,
            ),

        total_despachos:
            pedidosAsignados,
      }
      : null,

    updated_at:
      camionJson.updated_at ??
      camionJson.updatedAt ??
      null,
  };
};

/*
|--------------------------------------------------------------------------
| Include reutilizable
|--------------------------------------------------------------------------
*/

const jornadaActivaInclude = {
  model: JornadaReparto,
  as: 'jornadas',
  required: false,

  where: {
    estado: {
      [Op.in]: ESTADOS_JORNADA_ACTIVA,
    },
  },

  include: [
    {
      model: Despacho,
      as: 'despachos',
      required: false,

      attributes: [
        'id',
        'pedido_id',
        'orden_entrega',
        'estado',
      ],
    },
  ],
};

/*
|--------------------------------------------------------------------------
| Obtener todos
|--------------------------------------------------------------------------
*/

export const obtenerTodos = async () => {
  const camiones = await Camion.findAll({
    include: [
      jornadaActivaInclude,
    ],

    order: [
      ['id', 'ASC'],
    ],
  });

  return camiones.map(
    construirResumenCamion,
  );
};

/*
|--------------------------------------------------------------------------
| Obtener uno
|--------------------------------------------------------------------------
*/

export const obtenerPorId = async (id) => {
  const camion = await Camion.findByPk(id, {
    include: [
      jornadaActivaInclude,
    ],
  });

  if (!camion) {
    throw new NotFoundError(
      'Camión no encontrado',
      'CAMION_NO_ENCONTRADO',
    );
  }

  return construirResumenCamion(
    camion,
  );
};

