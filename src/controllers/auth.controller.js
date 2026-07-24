import {
  successResponse,
} from '../utils/apiResponse.js';

import * as authService from '../services/auth.service.js';

import {
  asyncHandler,
} from '../middlewares/asyncHandler.js';

export const login = asyncHandler(
  async (req, res) => {
    const session =
      await authService.login(req.body);

    return successResponse(
      res,
      session,
      'Sesión iniciada correctamente',
    );
  },
);

export const me = asyncHandler(
  async (req, res) => {
    const usuario =
      await authService.obtenerUsuarioSesion(
        req.auth.sub,
      );

    return successResponse(
      res,
      usuario,
      'Sesión obtenida correctamente',
    );
  },
);
