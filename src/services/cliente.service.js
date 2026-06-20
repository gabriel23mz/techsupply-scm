import Cliente from '../models/Cliente.js';
import Ubicacion from '../models/Ubicacion.js';

export const obtenerTodos = async () => {
  return await Cliente.findAll({
    where: {
      estado: true,
    },
    include: [
      {
        model: Ubicacion,
        attributes: ['id', 'nombre'],
      },
    ],
    order: [['id', 'ASC']],
  });
};

export const obtenerPorId = async (id) => {
  return await Cliente.findOne({
    where: {
      id,
      estado: true,
    },
    include: [
      {
        model: Ubicacion,
        attributes: ['id', 'nombre'],
      },
    ],
  });
};

export const crear = async (datos) => {
  return await Cliente.create(datos);
};

export const actualizar = async (id, datos) => {
  const cliente = await Cliente.findOne({
    where: {
      id,
      estado: true,
    },
  });

  if (!cliente) {
    return null;
  }

  await cliente.update(datos);

  return cliente;
};

export const eliminar = async (id) => {
  const cliente = await Cliente.findOne({
    where: {
      id,
      estado: true,
    },
  });

  if (!cliente) {
    return null;
  }

  await cliente.update({
    estado: false,
  });

  return true;
};

export const existeUbicacion = async (ubicacionId) => {
  return await Ubicacion.findOne({
    where: {
      id: ubicacionId,
      estado: true,
    },
  });
};

export const existeIdentificacion = async (
  identificacion,
  idExcluir = null,
) => {
  const cliente = await Cliente.findOne({
    where: {
      identificacion,
    },
  });

  if (!cliente) {
    return false;
  }

  if (idExcluir && cliente.id === Number(idExcluir)) {
    return false;
  }

  return true;
};
