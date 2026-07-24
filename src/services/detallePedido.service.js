import DetallePedido from '../models/DetallePedido.js';
import Pedido from '../models/Pedido.js';
import Producto from '../models/Producto.js';
import sequelize from '../config/database.js';

import {
  BusinessRuleError,
  NotFoundError,
} from '../utils/errors.js';

const recalcularTotalPedido = async (
  pedidoId,
  options = {},
) => {
  const { transaction } = options;

  const detalles = await DetallePedido.findAll({
    where: {
      pedido_id: pedidoId,
    },
    transaction,
  });

  const total = detalles.reduce(
    (acumulado, detalle) =>
      acumulado + Number(detalle.subtotal),
    0,
  );

  await Pedido.update(
    {
      total,
    },
    {
      where: {
        id: pedidoId,
      },
      transaction,
    },
  );
};

export const obtenerTodos = async () => {
  return await DetallePedido.findAll({
    include: [
      {
        model: Pedido,
        as: 'pedido',
      },
      {
        model: Producto,
        as: 'producto',
      },
    ],
    order: [['id', 'ASC']],
  });
};

export const obtenerPorId = async (id) => {
  const detalle = await DetallePedido.findByPk(id, {
    include: [
      {
        model: Pedido,
        as: 'pedido',
      },
      {
        model: Producto,
        as: 'producto',
      },
    ],
  });

  if (!detalle) {
    throw new NotFoundError(
      'Detalle no encontrado',
      'DETALLE_NO_ENCONTRADO',
    );
  }

  return detalle;
};

export const crear = async ({
  pedido_id,
  producto_id,
  cantidad,
}) => {
  /*
   * Invariante:
   * El ajuste de stock, el detalle y el total del pedido
   * deben confirmarse o revertirse como una sola operación.
   */
  const detalleId = await sequelize.transaction(
    async (transaction) => {
      const pedido = await Pedido.findByPk(
        pedido_id,
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

      if (
        pedido.estado !== 'PENDIENTE' &&
        pedido.estado !== 'PREPARANDO'
      ) {
        throw new BusinessRuleError(
          'No se pueden agregar productos a este pedido',
          'PEDIDO_NO_MODIFICABLE',
        );
      }

      const producto = await Producto.findOne({
        where: {
          id: producto_id,
          estado: true,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!producto) {
        throw new NotFoundError(
          'Producto no encontrado',
          'PRODUCTO_NO_ENCONTRADO',
        );
      }

      if (cantidad > producto.stock_actual) {
        throw new BusinessRuleError(
          'Stock insuficiente',
          'STOCK_INSUFICIENTE',
        );
      }

      const precio_unitario = Number(
        producto.precio_venta,
      );

      const subtotal =
        precio_unitario * Number(cantidad);

      await producto.update(
        {
          stock_actual:
            producto.stock_actual - Number(cantidad),
        },
        {
          transaction,
        },
      );

      const detalle = await DetallePedido.create(
        {
          pedido_id,
          producto_id,
          cantidad,
          precio_unitario,
          subtotal,
        },
        {
          transaction,
        },
      );

      await recalcularTotalPedido(
        pedido_id,
        { transaction },
      );

      return detalle.id;
    },
  );

  return await obtenerPorId(detalleId);
};

export const actualizar = async (
  id,
  datos,
) => {
  /*
   * Invariante:
   * La diferencia de stock, el subtotal y el total del pedido
   * permanecen dentro de la misma transacción.
   */
  const detalleId = await sequelize.transaction(
    async (transaction) => {
      const detalle =
        await DetallePedido.findByPk(
          id,
          {
            transaction,
            lock: transaction.LOCK.UPDATE,
          },
        );

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

      if (
        pedido.estado !== 'PENDIENTE' &&
        pedido.estado !== 'PREPARANDO'
      ) {
        throw new BusinessRuleError(
          'No se puede modificar este pedido',
          'PEDIDO_NO_MODIFICABLE',
        );
      }

      const producto = await Producto.findByPk(
        detalle.producto_id,
        {
          transaction,
          lock: transaction.LOCK.UPDATE,
        },
      );

      if (!producto) {
        throw new NotFoundError(
          'Producto no encontrado',
          'PRODUCTO_NO_ENCONTRADO',
        );
      }

      const cantidadNueva = Number(
        datos.cantidad,
      );

      const cantidadAnterior = Number(
        detalle.cantidad,
      );

      const diferencia =
        cantidadNueva - cantidadAnterior;

      if (diferencia > 0) {
        if (
          diferencia > producto.stock_actual
        ) {
          throw new BusinessRuleError(
            'Stock insuficiente',
            'STOCK_INSUFICIENTE',
          );
        }

        await producto.update(
          {
            stock_actual:
              producto.stock_actual -
              diferencia,
          },
          {
            transaction,
          },
        );
      }

      if (diferencia < 0) {
        await producto.update(
          {
            stock_actual:
              producto.stock_actual +
              Math.abs(diferencia),
          },
          {
            transaction,
          },
        );
      }

      const precioUnitario =
        Number(detalle.precio_unitario);

      const subtotal =
        precioUnitario * cantidadNueva;

      await detalle.update(
        {
          cantidad: cantidadNueva,
          subtotal,
        },
        {
          transaction,
        },
      );

      await recalcularTotalPedido(
        detalle.pedido_id,
        { transaction },
      );

      return detalle.id;
    },
  );

  return await obtenerPorId(detalleId);
};

export const eliminar = async (id) => {
  /*
   * Invariante:
   * La devolución de stock y la eliminación del detalle
   * se confirman o revierten juntas.
   */
  const eliminado = await sequelize.transaction(
    async (transaction) => {
      const detalle =
        await DetallePedido.findByPk(
          id,
          {
            transaction,
            lock: transaction.LOCK.UPDATE,
          },
        );

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

      if (
        pedido.estado !== 'PENDIENTE' &&
        pedido.estado !== 'PREPARANDO'
      ) {
        throw new BusinessRuleError(
          'No se puede modificar este pedido',
          'PEDIDO_NO_MODIFICABLE',
        );
      }

      const producto = await Producto.findByPk(
        detalle.producto_id,
        {
          transaction,
          lock: transaction.LOCK.UPDATE,
        },
      );

      if (!producto) {
        throw new NotFoundError(
          'Producto no encontrado',
          'PRODUCTO_NO_ENCONTRADO',
        );
      }

      await producto.update(
        {
          stock_actual:
            producto.stock_actual +
            detalle.cantidad,
        },
        {
          transaction,
        },
      );

      const pedidoId = detalle.pedido_id;

      await detalle.destroy({
        transaction,
      });

      await recalcularTotalPedido(
        pedidoId,
        { transaction },
      );

      return true;
    },
  );

  return eliminado;
};
