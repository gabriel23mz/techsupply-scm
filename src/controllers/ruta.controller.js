import * as rutaService from '../services/ruta.service.js';

import {
  successResponse,
} from '../utils/apiResponse.js';

import {
  asyncHandler,
} from '../middlewares/asyncHandler.js';

export const obtenerTodas = asyncHandler(
  async (req, res) => {
    const rutas = await rutaService.obtenerTodas();

    return successResponse(
      res,
      rutas,
      'Rutas obtenidas correctamente',
    );
  },
);

export const obtenerPorId = asyncHandler(
  async (req, res) => {
    const ruta = await rutaService.obtenerPorId(
      req.params.id,
    );

    return successResponse(
      res,
      ruta,
      'Ruta encontrada',
    );
  },
);

export const crear = asyncHandler(
  async (req, res) => {
    const ruta = await rutaService.crear(req.body);

    return successResponse(
      res,
      ruta,
      'Ruta creada correctamente',
      201,
    );
  },
);

export const actualizar = asyncHandler(
  async (req, res) => {
    const ruta = await rutaService.actualizar(
      req.params.id,
      req.body,
    );

    return successResponse(
      res,
      ruta,
      'Ruta actualizada correctamente',
    );
  },
);

export const eliminar = asyncHandler(
  async (req, res) => {
    await rutaService.eliminar(req.params.id);

    return successResponse(
      res,
      null,
      'Ruta eliminada correctamente',
    );
  },
);
