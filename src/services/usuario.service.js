import bcrypt from 'bcrypt';

import Usuario from '../models/Usuario.js';

import {
  BusinessRuleError,
  ConflictError,
  NotFoundError,
} from '../utils/errors.js';

const ROLES = [
  'ADMIN',
  'COMPRAS',
  'BODEGA',
  'VENTAS',
  'LOGISTICA',
];

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

const normalizarDatos = async (datos) => {
  const normalizados = { ...datos };

  if (normalizados.nombre !== undefined) {
    normalizados.nombre =
      capitalizarTexto(normalizados.nombre);
  }

  if (normalizados.apellido !== undefined) {
    normalizados.apellido =
      capitalizarTexto(normalizados.apellido);
  }

  if (normalizados.correo !== undefined) {
    normalizados.correo =
      String(normalizados.correo).trim().toLowerCase();
  }

  if (normalizados.password !== undefined) {
    normalizados.password_hash =
      await bcrypt.hash(
        normalizados.password,
        10,
      );

    delete normalizados.password;
  }

  return normalizados;
};

const validarRol = (rol) => {
  if (
    rol !== undefined &&
    !ROLES.includes(rol)
  ) {
    throw new BusinessRuleError(
      'Rol inválido',
      'ROL_INVALIDO',
    );
  }
};

export const obtenerTodos = async () => {
  return await Usuario.findAll({
    where: {
      estado: true,
    },
    attributes: {
      exclude: ['password_hash'],
    },
    order: [['id', 'ASC']],
  });
};

export const obtenerPorId = async (id) => {
  const usuario = await Usuario.findOne({
    where: {
      id,
      estado: true,
    },
    attributes: {
      exclude: ['password_hash'],
    },
  });

  if (!usuario) {
    throw new NotFoundError(
      'Usuario no encontrado',
      'USUARIO_NO_ENCONTRADO',
    );
  }

  return usuario;
};

export const obtenerPorCorreo = async (correo) => {
  return await Usuario.findOne({
    where: {
      correo,
    },
  });
};

export const crear = async (datos) => {
  validarRol(datos.rol);

  const datosNormalizados =
    await normalizarDatos(datos);

  if (
    await existeCorreo(datosNormalizados.correo)
  ) {
    throw new ConflictError(
      'El correo ya se encuentra registrado',
      'CORREO_DUPLICADO',
    );
  }

  const usuario =
    await Usuario.create(datosNormalizados);

  return await obtenerPorId(usuario.id);
};

export const actualizar = async (id, datos) => {
  await obtenerPorId(id);
  validarRol(datos.rol);

  const datosNormalizados =
    await normalizarDatos(datos);

  if (
    datosNormalizados.correo !== undefined &&
    await existeCorreo(
      datosNormalizados.correo,
      id,
    )
  ) {
    throw new ConflictError(
      'El correo ya se encuentra registrado',
      'CORREO_DUPLICADO',
    );
  }

  const usuario = await Usuario.findOne({
    where: {
      id,
      estado: true,
    },
  });

  await usuario.update(datosNormalizados);

  return await obtenerPorId(id);
};

export const eliminar = async (id) => {
  const usuario = await Usuario.findOne({
    where: {
      id,
      estado: true,
    },
  });

  if (!usuario) {
    throw new NotFoundError(
      'Usuario no encontrado',
      'USUARIO_NO_ENCONTRADO',
    );
  }

  await usuario.update({
    estado: false,
  });

  return true;
};

export const existeCorreo = async (
  correo,
  idExcluir = null,
) => {
  const usuario = await Usuario.findOne({
    where: {
      correo,
    },
  });

  if (!usuario) {
    return false;
  }

  if (
    idExcluir &&
    usuario.id === Number(idExcluir)
  ) {
    return false;
  }

  return true;
};
