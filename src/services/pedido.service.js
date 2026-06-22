import Pedido from '../models/Pedido.js';
import Cliente from '../models/Cliente.js';
import Usuario from '../models/Usuario.js';
import DetallePedido from '../models/DetallePedido.js';
import Producto from '../models/Producto.js';

export const obtenerTodos = async () => {
  return await Pedido.findAll({
    include: [
      {
        model: Cliente,
        attributes: ['id', 'nombre'],
      },
      {
        model: Usuario,
        attributes: [
          'id',
          'nombre',
          'apellido',
          'correo',
          'rol',
        ],
      },
    ],
    order: [['id', 'ASC']],
  });
};

export const obtenerPorId = async (id) => {
  return await Pedido.findByPk(id, {
    include: [
      {
        model: Cliente,
        attributes: ['id', 'nombre'],
      },
      {
        model: Usuario,
        attributes: [
          'id',
          'nombre',
          'apellido',
          'correo',
          'rol',
        ],
      },
    ],
  });
};

export const crear = async (datos) => {
  return await Pedido.create(datos);
};

export const actualizar = async (id, datos) => {
  const pedido = await Pedido.findByPk(id);

  if (!pedido) {
    return null;
  }

  await pedido.update(datos);

  return await obtenerPorId(id);
};

export const eliminar = async (id) => {
  const pedido = await Pedido.findByPk(id);

  if (!pedido) {
    return null;
  }

  await pedido.update({
    estado: 'CANCELADO',
  });

  return true;
};

export const preparar = async (id) => {
  const pedido = await Pedido.findByPk(id);

  if (!pedido) {
    return null;
  }

  if (pedido.estado !== 'PENDIENTE') {
    throw new Error(
      'Solo los pedidos PENDIENTES pueden prepararse',
    );
  }

  await pedido.update({
    estado: 'PREPARANDO',
  });

  return await obtenerPorId(id);
};

export const cancelar = async (id) => {
  const pedido = await Pedido.findByPk(id);

  if (!pedido) {
    return null;
  }

  if (
    pedido.estado !== 'PENDIENTE' &&
    pedido.estado !== 'PREPARANDO'
  ) {
    throw new Error(
      'Solo se pueden cancelar pedidos pendientes o en preparación',
    );
  }

  const detalles =
    await DetallePedido.findAll({
      where: {
        pedido_id: id,
      },
    });

  for (const detalle of detalles) {
    const producto =
      await Producto.findByPk(
        detalle.producto_id,
      );

    if (producto) {
      await producto.update({
        stock_actual:
          producto.stock_actual +
          detalle.cantidad,
      });
    }
  }

  await pedido.update({
    estado: 'CANCELADO',
  });

  return await obtenerPorId(id);
};

export const existeCliente = async (clienteId) => {
  return await Cliente.findOne({
    where: {
      id: clienteId,
      estado: true,
    },
  });
};

export const existeUsuario = async (usuarioId) => {
  return await Usuario.findOne({
    where: {
      id: usuarioId,
      estado: true,
    },
  });
};
