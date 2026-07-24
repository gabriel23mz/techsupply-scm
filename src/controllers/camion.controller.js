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

export const crear = asyncHandler(
  async (req, res) => {
    const camion =
      await camionService.crear(req.body);

    return successResponse(
      res,
      camion,
      'Camión creado correctamente',
      201,
    );
  },
);

export const actualizar = asyncHandler(
  async (req, res) => {
    const camion =
      await camionService.actualizar(
        req.params.id,
        req.body,
      );

    return successResponse(
      res,
      camion,
      'Camión actualizado correctamente',
    );
  },
);

export const eliminar = asyncHandler(
  async (req, res) => {
    const camion =
      await camionService.eliminar(
        req.params.id,
      );

    return successResponse(
      res,
      camion,
      'Camión desactivado correctamente',
    );
  },
);
