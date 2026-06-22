import Ubicacion from '../models/Ubicacion.js';

export const obtenerTodas = async () => {
  return await Ubicacion.findAll({
    where: {
      estado: true,
    },
    order: [['id', 'ASC']],
  });
};

export const obtenerPorId = async (id) => {
  return await Ubicacion.findOne({
    where: {
      id,
      estado: true,
    },
  });
};

export const crear = async (datos) => {
  return await Ubicacion.create(datos);
};

export const actualizar = async (id, datos) => {
  const ubicacion = await Ubicacion.findOne({
    where: {
      id,
      estado: true,
    },
  });

  if (!ubicacion) {
    return null;
  }

  await ubicacion.update(datos);

  return ubicacion;
};

export const eliminar = async (id) => {
  const ubicacion = await Ubicacion.findOne({
    where: {
      id,
      estado: true,
    },
  });

  if (!ubicacion) {
    return null;
  }

  await ubicacion.update({
    estado: false,
  });

  return true;
};

export const existePorNombre = async (
  nombre,
) => {
  return await Ubicacion.findOne({
    where: {
      nombre,
      estado: true,
    },
  });
};
