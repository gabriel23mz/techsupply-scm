import bcrypt from 'bcrypt';

import * as usuarioService from '../services/usuario.service.js';

import {
  successResponse,
  errorResponse,
} from '../utils/apiResponse.js';

const ROLES = [
  'ADMIN',
  'COMPRAS',
  'BODEGA',
  'VENTAS',
  'LOGISTICA',
];

const capitalizarTexto = (texto) => {
  return texto
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(
      (palabra) =>
        palabra.charAt(0).toUpperCase() +
        palabra.slice(1),
    )
    .join(' ');
};

export const obtenerTodos = async (req, res) => {
  try {
    const usuarios =
      await usuarioService.obtenerTodos();

    return successResponse(
      res,
      usuarios,
      'Usuarios obtenidos correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario =
      await usuarioService.obtenerPorId(id);

    if (!usuario) {
      return errorResponse(
        res,
        'Usuario no encontrado',
        404,
      );
    }

    return successResponse(
      res,
      usuario,
      'Usuario encontrado',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const crear = async (req, res) => {
  try {
    let {
      nombre,
      apellido,
      correo,
      password,
      rol,
    } = req.body;

    if (!nombre?.trim()) {
      return errorResponse(
        res,
        'El nombre es obligatorio',
        400,
      );
    }

    if (!apellido?.trim()) {
      return errorResponse(
        res,
        'El apellido es obligatorio',
        400,
      );
    }

    nombre = capitalizarTexto(nombre);
    apellido = capitalizarTexto(apellido);

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(correo)) {
      return errorResponse(
        res,
        'Correo electrónico inválido',
        400,
      );
    }

    const existeCorreo =
      await usuarioService.existeCorreo(
        correo,
      );

    if (existeCorreo) {
      return errorResponse(
        res,
        'El correo ya se encuentra registrado',
        400,
      );
    }

    if (!password || password.length < 6) {
      return errorResponse(
        res,
        'La contraseña debe tener al menos 6 caracteres',
        400,
      );
    }

    if (!ROLES.includes(rol)) {
      return errorResponse(
        res,
        'Rol inválido',
        400,
      );
    }

    const password_hash =
      await bcrypt.hash(password, 10);

    const usuario =
      await usuarioService.crear({
        nombre,
        apellido,
        correo,
        password_hash,
        rol,
      });

    const usuarioCreado =
      await usuarioService.obtenerPorId(
        usuario.id,
      );

    return successResponse(
      res,
      usuarioCreado,
      'Usuario creado correctamente',
      201,
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const actualizar = async (req, res) => {
  try {
    const { id } = req.params;

    const usuarioExistente =
      await usuarioService.obtenerPorId(id);

    if (!usuarioExistente) {
      return errorResponse(
        res,
        'Usuario no encontrado',
        404,
      );
    }

    const datos = { ...req.body };

    if (datos.nombre !== undefined) {
      datos.nombre =
        capitalizarTexto(datos.nombre);
    }

    if (datos.apellido !== undefined) {
      datos.apellido =
        capitalizarTexto(datos.apellido);
    }

    if (datos.correo !== undefined) {
      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(datos.correo)) {
        return errorResponse(
          res,
          'Correo electrónico inválido',
          400,
        );
      }

      const existeCorreo =
        await usuarioService.existeCorreo(
          datos.correo,
          id,
        );

      if (existeCorreo) {
        return errorResponse(
          res,
          'El correo ya se encuentra registrado',
          400,
        );
      }
    }

    if (datos.password !== undefined) {
      if (datos.password.length < 6) {
        return errorResponse(
          res,
          'La contraseña debe tener al menos 6 caracteres',
          400,
        );
      }

      datos.password_hash =
        await bcrypt.hash(
          datos.password,
          10,
        );

      delete datos.password;
    }

    if (
      datos.rol !== undefined &&
      !ROLES.includes(datos.rol)
    ) {
      return errorResponse(
        res,
        'Rol inválido',
        400,
      );
    }

    const usuario =
      await usuarioService.actualizar(
        id,
        datos,
      );

    return successResponse(
      res,
      usuario,
      'Usuario actualizado correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    const eliminado =
      await usuarioService.eliminar(id);

    if (!eliminado) {
      return errorResponse(
        res,
        'Usuario no encontrado',
        404,
      );
    }

    return successResponse(
      res,
      null,
      'Usuario eliminado correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
