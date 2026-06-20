import Categoria from '../models/Categoria.js';

export const obtenerTodas = async () => {
  return await Categoria.findAll({
    where: {
      estado: true,
    },
    order: [['id', 'ASC']],
  });
};

export const obtenerPorId = async (id) => {
  return await Categoria.findOne({
    where: {
      id,
      estado: true,
    },
  });
};

export const crear = async (datos) => {
  return await Categoria.create(datos);
};

export const actualizar = async (id, datos) => {
  const categoria = await Categoria.findOne({
    where: {
      id,
      estado: true,
    },
  });

  if (!categoria) {
    return null;
  }

  await categoria.update(datos);

  return categoria;
};

export const eliminar = async (id) => {
  const categoria = await Categoria.findOne({
    where: {
      id,
      estado: true,
    },
  });

  if (!categoria) {
    return null;
  }

  await categoria.update({
    estado: false,
  });

  return true;
};

export const existeNombre = async (
  nombre,
  idExcluir = null,
) => {
  const categoria = await Categoria.findOne({
    where: {
      nombre,
      estado: true,
    },
  });

  if (!categoria) {
    return false;
  }

  if (
    idExcluir &&
    categoria.id === Number(idExcluir)
  ) {
    return false;
  }

  return true;
};
