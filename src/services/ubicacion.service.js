import Ubicacion from '../models/Ubicacion.js';

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

const normalizarCoordenadas = (datos) => {
  const normalizados = { ...datos };
  const tieneLatitud =
    normalizados.latitud !== undefined &&
    normalizados.latitud !== null &&
    normalizados.latitud !== '';
  const tieneLongitud =
    normalizados.longitud !== undefined &&
    normalizados.longitud !== null &&
    normalizados.longitud !== '';

  if (tieneLatitud && tieneLongitud) {
    normalizados.latitud = Number(
      normalizados.latitud,
    );
    normalizados.longitud = Number(
      normalizados.longitud,
    );
  } else if (
    normalizados.latitud !== undefined ||
    normalizados.longitud !== undefined
  ) {
    normalizados.latitud = null;
    normalizados.longitud = null;
  }

  return normalizados;
};

const normalizarDatos = (datos) => {
  const normalizados = normalizarCoordenadas(datos);

  if (normalizados.nombre !== undefined) {
    normalizados.nombre =
      capitalizarTexto(normalizados.nombre);
  }

  return normalizados;
};

export const obtenerTodas = async () => {
  return await Ubicacion.findAll({
    where: {
      estado: true,
    },
    order: [['id', 'ASC']],
  });
};

export const obtenerPorId = async (id) => {
  const ubicacion = await Ubicacion.findOne({
    where: {
      id,
      estado: true,
    },
  });

  if (!ubicacion) {
    throw new NotFoundError(
      'Ubicación no encontrada',
      'UBICACION_NO_ENCONTRADA',
    );
  }

  return ubicacion;
};

export const crear = async (datos) => {
  const datosNormalizados = {
    ...normalizarDatos(datos),
    estado: true,
  };

  const existe = await existePorNombre(
    datosNormalizados.nombre,
  );

  if (existe) {
    throw new ConflictError(
      'Ya existe una ubicación con ese nombre',
      'UBICACION_DUPLICADA',
    );
  }

  return await Ubicacion.create(
    datosNormalizados,
  );
};

export const actualizar = async (id, datos) => {
  const ubicacion = await obtenerPorId(id);
  const datosNormalizados = normalizarDatos(datos);

  if (datosNormalizados.nombre !== undefined) {
    const existe = await existePorNombre(
      datosNormalizados.nombre,
    );

    if (
      existe &&
      existe.id !== Number(id)
    ) {
      throw new ConflictError(
        'Ya existe una ubicación con ese nombre',
        'UBICACION_DUPLICADA',
      );
    }
  }

  await ubicacion.update(datosNormalizados);

  return ubicacion;
};

export const eliminar = async (id) => {
  const ubicacion = await obtenerPorId(id);

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
