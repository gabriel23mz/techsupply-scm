import * as usuarioService from '../services/usuario.service.js';

import {
  successResponse,
} from '../utils/apiResponse.js';

import {
  asyncHandler,
} from '../middlewares/asyncHandler.js';

export const obtenerTodos = asyncHandler(
  async (req, res) => {
    const usuarios =
      await usuarioService.obtenerTodos();

    return successResponse(
      res,
      usuarios,
      'Usuarios obtenidos correctamente',
    );
  },
);

export const obtenerPorId = asyncHandler(
  async (req, res) => {
    const usuario =
      await usuarioService.obtenerPorId(
        req.params.id,
      );

    return successResponse(
      res,
      usuario,
      'Usuario encontrado',
    );
  },
);

export const crear = asyncHandler(
  async (req, res) => {
    const usuario =
      await usuarioService.crear(req.body);

    return successResponse(
      res,
      usuario,
      'Usuario creado correctamente',
      201,
    );
  },
);

export const actualizar = asyncHandler(
  async (req, res) => {
    const usuario =
      await usuarioService.actualizar(
        req.params.id,
        req.body,
      );

    return successResponse(
      res,
      usuario,
      'Usuario actualizado correctamente',
    );
  },
);

export const eliminar = asyncHandler(
  async (req, res) => {
    await usuarioService.eliminar(req.params.id);

    return successResponse(
      res,
      null,
      'Usuario eliminado correctamente',
    );
  },
);
