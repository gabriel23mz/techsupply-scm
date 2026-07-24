import * as ubicacionService from '../services/ubicacion.service.js';

import {
  successResponse,
} from '../utils/apiResponse.js';

import {
  asyncHandler,
} from '../middlewares/asyncHandler.js';

export const obtenerTodas = asyncHandler(
  async (req, res) => {
    const ubicaciones =
      await ubicacionService.obtenerTodas();

    return successResponse(
      res,
      ubicaciones,
      'Ubicaciones obtenidas correctamente',
    );
  },
);

export const obtenerPorId = asyncHandler(
  async (req, res) => {
    const ubicacion =
      await ubicacionService.obtenerPorId(
        req.params.id,
      );

    return successResponse(
      res,
      ubicacion,
      'Ubicación encontrada',
    );
  },
);

export const crear = asyncHandler(
  async (req, res) => {
    const ubicacion =
      await ubicacionService.crear(req.body);

    return successResponse(
      res,
      ubicacion,
      'Ubicación creada correctamente',
      201,
    );
  },
);

export const actualizar = asyncHandler(
  async (req, res) => {
    const ubicacion =
      await ubicacionService.actualizar(
        req.params.id,
        req.body,
      );

    return successResponse(
      res,
      ubicacion,
      'Ubicación actualizada correctamente',
    );
  },
);

export const eliminar = asyncHandler(
  async (req, res) => {
    await ubicacionService.eliminar(req.params.id);

    return successResponse(
      res,
      null,
      'Ubicación eliminada correctamente',
    );
  },
);
