import Usuario from '../models/Usuario.js';

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
  return await Usuario.findOne({
    where: {
      id,
      estado: true,
    },
    attributes: {
      exclude: ['password_hash'],
    },
  });
};

export const obtenerPorCorreo = async (correo) => {
  return await Usuario.findOne({
    where: {
      correo,
    },
  });
};

export const crear = async (datos) => {
  return await Usuario.create(datos);
};

export const actualizar = async (id, datos) => {
  const usuario = await Usuario.findOne({
    where: {
      id,
      estado: true,
    },
  });

  if (!usuario) {
    return null;
  }

  await usuario.update(datos);

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
    return null;
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
