import Ruta from '../models/Ruta.js';
import Ubicacion from '../models/Ubicacion.js';

export const obtenerTodas = async () => {
  return await Ruta.findAll({
    where: {
      estado: true,
    },
    include: [
      {
        model: Ubicacion,
        as: 'origen',
        attributes: ['id', 'nombre'],
      },
      {
        model: Ubicacion,
        as: 'destino',
        attributes: ['id', 'nombre'],
      },
    ],
    order: [['id', 'ASC']],
  });
};

export const obtenerPorId = async (id) => {
  return await Ruta.findOne({
    where: {
      id,
      estado: true,
    },
    include: [
      {
        model: Ubicacion,
        as: 'origen',
        attributes: ['id', 'nombre'],
      },
      {
        model: Ubicacion,
        as: 'destino',
        attributes: ['id', 'nombre'],
      },
    ],
  });
};

export const crear = async (datos) => {
  return await Ruta.create(datos);
};

export const actualizar = async (id, datos) => {
  const ruta = await Ruta.findOne({
    where: {
      id,
      estado: true,
    },
  });

  if (!ruta) {
    return null;
  }

  await ruta.update(datos);

  return ruta;
};

export const eliminar = async (id) => {
  const ruta = await Ruta.findOne({
    where: {
      id,
      estado: true,
    },
  });

  if (!ruta) {
    return null;
  }

  await ruta.update({
    estado: false,
  });

  return true;
};

export const existeUbicacion = async (id) => {
  return await Ubicacion.findOne({
    where: {
      id,
      estado: true,
    },
  });
};

export const existeRuta = async (
  origen_id,
  destino_id,
  idExcluir = null,
) => {
  const ruta = await Ruta.findOne({
    where: {
      origen_id,
      destino_id,
      estado: true,
    },
  });

  if (!ruta) {
    return false;
  }

  if (idExcluir && ruta.id === Number(idExcluir)) {
    return false;
  }

  return true;
};
