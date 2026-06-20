import Pedido from '../models/Pedido.js';
import Cliente from '../models/Cliente.js';
import Usuario from '../models/Usuario.js';

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
