import DetallePedido from '../models/DetallePedido.js';
import Pedido from '../models/Pedido.js';
import Producto from '../models/Producto.js';
import sequelize from '../config/database.js';

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
    include: [Pedido, Producto],
    order: [['id', 'ASC']],
  });
};

export const obtenerPorId = async (id) => {
  return await DetallePedido.findByPk(id, {
    include: [Pedido, Producto],
  });
};

export const crear = async ({
  pedido_id,
  producto_id,
  cantidad,
}) => {
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
        throw new Error('Pedido no encontrado');
      }

      if (
        pedido.estado !== 'PENDIENTE' &&
        pedido.estado !== 'PREPARANDO'
      ) {
        throw new Error(
          'No se pueden agregar productos a este pedido',
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
        throw new Error('Producto no encontrado');
      }

      if (cantidad > producto.stock_actual) {
        throw new Error('Stock insuficiente');
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
        return null;
      }

      const pedido = await Pedido.findByPk(
        detalle.pedido_id,
        {
          transaction,
          lock: transaction.LOCK.UPDATE,
        },
      );

      if (!pedido) {
        throw new Error('Pedido no encontrado');
      }

      if (
        pedido.estado !== 'PENDIENTE' &&
        pedido.estado !== 'PREPARANDO'
      ) {
        throw new Error(
          'No se puede modificar este pedido',
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
        throw new Error('Producto no encontrado');
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
          throw new Error(
            'Stock insuficiente',
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

  if (!detalleId) {
    return null;
  }

  return await obtenerPorId(detalleId);
};

export const eliminar = async (id) => {
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
        return null;
      }

      const pedido = await Pedido.findByPk(
        detalle.pedido_id,
        {
          transaction,
          lock: transaction.LOCK.UPDATE,
        },
      );

      if (!pedido) {
        throw new Error('Pedido no encontrado');
      }

      if (
        pedido.estado !== 'PENDIENTE' &&
        pedido.estado !== 'PREPARANDO'
      ) {
        throw new Error(
          'No se puede modificar este pedido',
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
        throw new Error('Producto no encontrado');
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
