import Ruta from '../models/Ruta.js';
import Ubicacion from '../models/Ubicacion.js';

import {
  BusinessRuleError,
  ConflictError,
  NotFoundError,
} from '../utils/errors.js';

const normalizarDatos = (datos) => {
  const normalizados = { ...datos };

  if (normalizados.distancia_km !== undefined) {
    normalizados.distancia_km = Number(
      normalizados.distancia_km,
    );
  }

  return normalizados;
};

const validarRelacionRuta = async (
  origenId,
  destinoId,
  idExcluir = null,
) => {
  if (Number(origenId) === Number(destinoId)) {
    throw new BusinessRuleError(
      'Origen y destino no pueden ser iguales',
      'RUTA_ORIGEN_DESTINO_IGUALES',
    );
  }

  const origen = await existeUbicacion(origenId);

  if (!origen) {
    throw new BusinessRuleError(
      'La ubicación de origen no existe',
      'RUTA_ORIGEN_NO_EXISTE',
    );
  }

  const destino = await existeUbicacion(destinoId);

  if (!destino) {
    throw new BusinessRuleError(
      'La ubicación de destino no existe',
      'RUTA_DESTINO_NO_EXISTE',
    );
  }

  if (
    await existeRuta(
      origenId,
      destinoId,
      idExcluir,
    )
  ) {
    throw new ConflictError(
      'La ruta ya existe',
      'RUTA_DUPLICADA',
    );
  }
};

export const obtenerTodas = async () => {
  return await Ruta.findAll({
    where: {
      estado: true,
    },
    include: [
      {
        model: Ubicacion,
       as: 'ubicacion',
        as: 'origen',
        attributes: ['id', 'nombre'],
      },
      {
        model: Ubicacion,
       as: 'ubicacion',
        as: 'destino',
        attributes: ['id', 'nombre'],
      },
    ],
    order: [['id', 'ASC']],
  });
};

export const obtenerPorId = async (id) => {
  const ruta = await Ruta.findOne({
    where: {
      id,
      estado: true,
    },
    include: [
      {
        model: Ubicacion,
       as: 'ubicacion',
        as: 'origen',
        attributes: ['id', 'nombre'],
      },
      {
        model: Ubicacion,
       as: 'ubicacion',
        as: 'destino',
        attributes: ['id', 'nombre'],
      },
    ],
  });

  if (!ruta) {
    throw new NotFoundError(
      'Ruta no encontrada',
      'RUTA_NO_ENCONTRADA',
    );
  }

  return ruta;
};

export const crear = async (datos) => {
  const datosNormalizados = normalizarDatos(datos);

  await validarRelacionRuta(
    datosNormalizados.origen_id,
    datosNormalizados.destino_id,
  );

  return await Ruta.create(datosNormalizados);
};

export const actualizar = async (id, datos) => {
  const ruta = await obtenerPorId(id);
  const datosNormalizados = normalizarDatos(datos);

  const origenId =
    datosNormalizados.origen_id ?? ruta.origen_id;
  const destinoId =
    datosNormalizados.destino_id ?? ruta.destino_id;

  if (
    datosNormalizados.origen_id !== undefined ||
    datosNormalizados.destino_id !== undefined
  ) {
    await validarRelacionRuta(
      origenId,
      destinoId,
      id,
    );
  }

  await ruta.update(datosNormalizados);

  return ruta;
};

export const eliminar = async (id) => {
  const ruta = await obtenerPorId(id);

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
