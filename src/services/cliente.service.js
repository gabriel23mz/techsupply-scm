import Cliente from '../models/Cliente.js';
import Ubicacion from '../models/Ubicacion.js';

import {
  BODEGA_CENTRAL_ID,
} from '../constants/logistica.js';

import {
  BusinessRuleError,
  ConflictError,
  NotFoundError,
} from '../utils/errors.js';

const capitalizarNombre = (nombre) =>
  nombre
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
      capitalizarNombre(normalizados.nombre);
  }

  if (normalizados.correo !== undefined) {
    normalizados.correo =
      String(normalizados.correo).trim().toLowerCase();
  }

  if (normalizados.direccion !== undefined) {
    normalizados.direccion =
      normalizados.direccion.trim();
  }

  return normalizados;
};

const validarUbicacionCliente = async (
  ubicacionId,
) => {
  if (ubicacionId === undefined) {
    return;
  }

  if (Number(ubicacionId) === BODEGA_CENTRAL_ID) {
    throw new BusinessRuleError(
      'La ubicación seleccionada es de uso interno',
      'UBICACION_INTERNA',
    );
  }

  const ubicacion =
    await existeUbicacion(ubicacionId);

  if (!ubicacion) {
    throw new BusinessRuleError(
      'La ubicación especificada no existe',
      'UBICACION_NO_EXISTE',
    );
  }
};

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
  const cliente = await Cliente.findOne({
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

  if (!cliente) {
    throw new NotFoundError(
      'Cliente no encontrado',
      'CLIENTE_NO_ENCONTRADO',
    );
  }

  return cliente;
};

export const crear = async (datos) => {
  const datosNormalizados = normalizarDatos(datos);

  if (
    await existeIdentificacion(
      datosNormalizados.identificacion,
    )
  ) {
    throw new ConflictError(
      'La identificación ya se encuentra registrada',
      'IDENTIFICACION_DUPLICADA',
    );
  }

  await validarUbicacionCliente(
    datosNormalizados.ubicacion_id,
  );

  return await Cliente.create(datosNormalizados);
};

export const actualizar = async (id, datos) => {
  const cliente = await obtenerPorId(id);
  const datosNormalizados = normalizarDatos(datos);

  if (
    datosNormalizados.identificacion !== undefined &&
    await existeIdentificacion(
      datosNormalizados.identificacion,
      id,
    )
  ) {
    throw new ConflictError(
      'La identificación ya se encuentra registrada',
      'IDENTIFICACION_DUPLICADA',
    );
  }

  await validarUbicacionCliente(
    datosNormalizados.ubicacion_id,
  );

  await cliente.update(datosNormalizados);

  return cliente;
};

export const eliminar = async (id) => {
  const cliente = await obtenerPorId(id);

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
