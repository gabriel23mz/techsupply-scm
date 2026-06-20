import Producto from '../models/Producto.js';
import Categoria from '../models/Categoria.js';

export const obtenerTodos = async () => {
  return await Producto.findAll({
    where: {
      estado: true,
    },
    include: [
      {
        model: Categoria,
        attributes: ['id', 'nombre'],
      },
    ],
    order: [['id', 'ASC']],
  });
};

export const obtenerPorId = async (id) => {
  return await Producto.findOne({
    where: {
      id,
      estado: true,
    },
    include: [
      {
        model: Categoria,
        attributes: ['id', 'nombre'],
      },
    ],
  });
};

export const crear = async (datos) => {
  return await Producto.create(datos);
};

export const actualizar = async (id, datos) => {
  const producto = await Producto.findOne({
    where: {
      id,
      estado: true,
    },
  });

  if (!producto) {
    return null;
  }

  await producto.update(datos);

  return await obtenerPorId(id);
};

export const eliminar = async (id) => {
  const producto = await Producto.findOne({
    where: {
      id,
      estado: true,
    },
  });

  if (!producto) {
    return null;
  }

  await producto.update({
    estado: false,
  });

  return true;
};

export const existeCategoria = async (categoriaId) => {
  return await Categoria.findOne({
    where: {
      id: categoriaId,
      estado: true,
    },
  });
};

export const existeCodigo = async (
  codigo,
  idExcluir = null,
) => {
  const producto = await Producto.findOne({
    where: {
      codigo,
    },
  });

  if (!producto) {
    return false;
  }

  if (
    idExcluir &&
    producto.id === Number(idExcluir)
  ) {
    return false;
  }

  return true;
};
