import {
  errorResponse,
  successResponse,
} from '../utils/apiResponse.js';

import * as authService from '../services/auth.service.js';

export const login = async (
  req,
  res,
) => {
  try {
    const {
      correo,
      password,
    } = req.body;

    if (!correo?.trim()) {
      return errorResponse(
        res,
        'El correo es obligatorio',
        400,
      );
    }

    if (!password) {
      return errorResponse(
        res,
        'La contraseña es obligatoria',
        400,
      );
    }

    const session =
      await authService.login({
        correo,
        password,
      });

    return successResponse(
      res,
      session,
      'Sesión iniciada correctamente',
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
      401,
    );
  }
};

export const me = async (
  req,
  res,
) => {
  try {
    const usuario =
      await authService.obtenerUsuarioSesion(
        req.auth.sub,
      );

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
      'Sesión obtenida correctamente',
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
      401,
    );
  }
};
