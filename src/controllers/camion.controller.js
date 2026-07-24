import * as camionService from '../services/camion.service.js';

import {
  successResponse,
} from '../utils/apiResponse.js';

import {
  asyncHandler,
} from '../middlewares/asyncHandler.js';

export const obtenerTodos = asyncHandler(
  async (req, res) => {
    const camiones =
      await camionService.obtenerTodos();

    return successResponse(
      res,
      camiones,
      'Camiones obtenidos correctamente',
    );
  },
);

export const obtenerPorId = asyncHandler(
  async (req, res) => {
    const camion =
      await camionService.obtenerPorId(
        req.params.id,
      );

    return successResponse(
      res,
      camion,
      'Camión obtenido correctamente',
    );
  },
);
