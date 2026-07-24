import sequelize from '../config/database.js';
import db from '../models/index.js';

import {
  BusinessRuleError,
  NotFoundError,
} from '../utils/errors.js';

const {
  Pedido,
  Cliente,
  Ubicacion,
  DetallePedido,
  Producto,
  JornadaReparto,
  Camion,
  Despacho,
} = db;

const detalleInclude = [
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
  {
    model: DetallePedido,
    as: 'detalles',
    include: [
      {
        model: Producto,
        as: 'producto',
      },
    ],
  },
];

const cargaInclude = [
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
];

const calcularProgresoPreparacion = (pedido) => {
  const plain = pedido.toJSON
    ? pedido.toJSON()
    : pedido;

  const detalles = plain.detalles ?? [];

  const solicitado = detalles.reduce(
    (total, detalle) =>
      total + Number(detalle.cantidad ?? 0),
    0,
  );

  const preparado = detalles.reduce(
    (total, detalle) =>
      total + Number(detalle.cantidad_preparada ?? 0),
    0,
  );

  return {
    ...plain,
    progreso_preparacion: {
      solicitado,
      preparado,
      completo:
        solicitado > 0 &&
        preparado === solicitado,
    },
  };
};

const calcularProgresoCarga = (jornada) => {
  const plain = jornada.toJSON
    ? jornada.toJSON()
    : jornada;

  const despachos = plain.despachos ?? [];
  const cargados = despachos.filter(
    (despacho) => despacho.cargado,
  ).length;

  return {
    ...plain,
    carga_confirmada:
      Boolean(plain.carga_confirmada_en),
    progreso_carga: {
      total: despachos.length,
      cargados,
      completo:
        despachos.length > 0 &&
        cargados === despachos.length,
    },
  };
};

export const obtenerPedidosPreparacion = async () => {
  const pedidos = await Pedido.findAll({
    where: {
      estado: 'PREPARANDO',
    },
    include: detalleInclude,
    order: [['id', 'ASC']],
  });

  return pedidos.map(
    calcularProgresoPreparacion,
  );
};

export const obtenerPedidoPreparacion = async (id) => {
  const pedido = await Pedido.findOne({
    where: {
      id,
      estado: 'PREPARANDO',
    },
    include: detalleInclude,
  });

  if (!pedido) {
    throw new NotFoundError(
      'Pedido en preparación no encontrado',
      'PEDIDO_PREPARACION_NO_ENCONTRADO',
    );
  }

  return calcularProgresoPreparacion(pedido);
};

export const actualizarPreparacionDetalle = async (
  id,
  cantidadPreparada,
  user,
) => {
  const detalleId = await sequelize.transaction(
    async (transaction) => {
      const detalle =
        await DetallePedido.findByPk(id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

      if (!detalle) {
        throw new NotFoundError(
          'Detalle no encontrado',
          'DETALLE_NO_ENCONTRADO',
        );
      }

      const pedido = await Pedido.findByPk(
        detalle.pedido_id,
        {
          transaction,
          lock: transaction.LOCK.UPDATE,
        },
      );

      if (!pedido) {
        throw new NotFoundError(
          'Pedido no encontrado',
          'PEDIDO_NO_ENCONTRADO',
        );
      }

      if (pedido.estado !== 'PREPARANDO') {
        throw new BusinessRuleError(
          'Solo se preparan pedidos en estado PREPARANDO',
          'PEDIDO_ESTADO_INVALIDO_PREPARACION',
        );
      }

      const cantidad = Number(cantidadPreparada);
      const solicitada = Number(detalle.cantidad);

      if (
        !Number.isInteger(cantidad) ||
        cantidad < 0 ||
        cantidad > solicitada
      ) {
        throw new BusinessRuleError(
          'Cantidad preparada inválida',
          'CANTIDAD_PREPARADA_INVALIDA',
        );
      }

      const completo = cantidad === solicitada;

      await detalle.update(
        {
          cantidad_preparada: cantidad,
          preparado_por_usuario_id:
            completo ? user?.id ?? null : user?.id ?? null,
          fecha_preparacion:
            completo ? new Date() : null,
        },
        {
          transaction,
        },
      );

      return detalle.id;
    },
  );

  return DetallePedido.findByPk(detalleId, {
    include: [
      {
        model: Producto,
        as: 'producto',
      },
    ],
  });
};

export const finalizarPreparacion = async (
  id,
  user,
) => {
  const pedidoService =
    await import('./pedido.service.js');

  return pedidoService.finalizarPreparacion(
    id,
    user,
  );
};

export const obtenerJornadasCarga = async () => {
  const jornadas = await JornadaReparto.findAll({
    where: {
      estado: 'PLANIFICADA',
    },
    include: cargaInclude,
    order: [['id', 'ASC']],
  });

  return jornadas.map(calcularProgresoCarga);
};

export const obtenerJornadaCarga = async (id) => {
  const jornada = await JornadaReparto.findOne({
    where: {
      id,
      estado: 'PLANIFICADA',
    },
    include: cargaInclude,
  });

  if (!jornada) {
    throw new NotFoundError(
      'Jornada planificada no encontrada',
      'JORNADA_CARGA_NO_ENCONTRADA',
    );
  }

  return calcularProgresoCarga(jornada);
};

export const actualizarCargaDespacho = async (
  id,
  cargado,
  user,
) => {
  const despachoId = await sequelize.transaction(
    async (transaction) => {
      const despacho = await Despacho.findByPk(
        id,
        {
          transaction,
          lock: transaction.LOCK.UPDATE,
        },
      );

      if (!despacho) {
        throw new NotFoundError(
          'Despacho no encontrado',
          'DESPACHO_NO_ENCONTRADO',
        );
      }

      const jornada =
        await JornadaReparto.findByPk(
          despacho.jornada_reparto_id,
          {
            transaction,
            lock: transaction.LOCK.UPDATE,
          },
        );

      if (!jornada) {
        throw new BusinessRuleError(
          'El despacho no está asociado a una jornada',
          'DESPACHO_SIN_JORNADA',
        );
      }

      if (jornada.estado !== 'PLANIFICADA') {
        throw new BusinessRuleError(
          'No se puede modificar carga después de iniciar la jornada',
          'JORNADA_CARGA_CERRADA',
        );
      }

      const nextCargado = Boolean(cargado);

      await despacho.update(
        {
          cargado: nextCargado,
          cargado_por_usuario_id:
            nextCargado ? user?.id ?? null : null,
          fecha_carga:
            nextCargado ? new Date() : null,
        },
        {
          transaction,
        },
      );

      if (
        !nextCargado &&
        jornada.carga_confirmada_en
      ) {
        await jornada.update(
          {
            carga_confirmada_por_usuario_id: null,
            carga_confirmada_en: null,
          },
          {
            transaction,
          },
        );
      }

      return despacho.id;
    },
  );

  return Despacho.findByPk(despachoId);
};

export const confirmarCargaJornada = async (
  id,
  user,
) => {
  const jornadaId = await sequelize.transaction(
    async (transaction) => {
      const jornada =
        await JornadaReparto.findByPk(id, {
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
          'Solo se confirma carga de jornadas planificadas',
          'JORNADA_ESTADO_INVALIDO_CARGA',
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
          'JORNADA_SIN_DESPACHOS',
        );
      }

      const incompleto = despachos.some(
        (despacho) => !despacho.cargado,
      );

      if (incompleto) {
        throw new BusinessRuleError(
          'Todos los despachos deben estar cargados',
          'JORNADA_CARGA_INCOMPLETA',
        );
      }

      await jornada.update(
        {
          carga_confirmada_por_usuario_id:
            user?.id ?? null,
          carga_confirmada_en: new Date(),
        },
        {
          transaction,
        },
      );

      return jornada.id;
    },
  );

  return obtenerJornadaCarga(jornadaId);
};
