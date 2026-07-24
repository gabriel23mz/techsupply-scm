import Categoria from '../models/Categoria.js';

import {
  ConflictError,
  NotFoundError,
} from '../utils/errors.js';

const capitalizarTexto = (texto) =>
  texto
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(
      (palabra) =>
        palabra.charAt(0).toUpperCase() +
        palabra.slice(1),
    )
    .join(' ');

const normalizarDatos = (datos) => {
  const normalizados = { ...datos };

  if (normalizados.nombre !== undefined) {
    normalizados.nombre =
      capitalizarTexto(normalizados.nombre);
  }

  if (normalizados.descripcion !== undefined) {
    normalizados.descripcion =
      normalizados.descripcion?.trim() || null;
  }

  return normalizados;
};

export const obtenerTodas = async () => {
  return await Categoria.findAll({
    where: {
      estado: true,
    },
    order: [['id', 'ASC']],
  });
};

export const obtenerPorId = async (id) => {
  const categoria = await Categoria.findOne({
    where: {
      id,
      estado: true,
    },
  });

  if (!categoria) {
    throw new NotFoundError(
      'Categoría no encontrada',
      'CATEGORIA_NO_ENCONTRADA',
    );
  }

  return categoria;
};

export const crear = async (datos) => {
  const datosNormalizados = normalizarDatos(datos);

  if (
    await existeNombre(datosNormalizados.nombre)
  ) {
    throw new ConflictError(
      'La categoría ya existe',
      'CATEGORIA_DUPLICADA',
    );
  }

  return await Categoria.create(datosNormalizados);
};

export const actualizar = async (id, datos) => {
  const categoria = await obtenerPorId(id);
  const datosNormalizados = normalizarDatos(datos);

  if (
    datosNormalizados.nombre !== undefined &&
    await existeNombre(
      datosNormalizados.nombre,
      id,
    )
  ) {
    throw new ConflictError(
      'La categoría ya existe',
      'CATEGORIA_DUPLICADA',
    );
  }

  await categoria.update(datosNormalizados);

  return categoria;
};

export const eliminar = async (id) => {
  const categoria = await obtenerPorId(id);

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
