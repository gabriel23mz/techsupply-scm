import * as categoriaService from '../services/categoria.service.js';

import {
  successResponse,
} from '../utils/apiResponse.js';

import {
  asyncHandler,
} from '../middlewares/asyncHandler.js';

export const obtenerTodas = asyncHandler(
  async (req, res) => {
    const categorias =
      await categoriaService.obtenerTodas();

    return successResponse(
      res,
      categorias,
      'Categorías obtenidas correctamente',
    );
  },
);

export const obtenerPorId = asyncHandler(
  async (req, res) => {
    const categoria =
      await categoriaService.obtenerPorId(
        req.params.id,
      );

    return successResponse(
      res,
      categoria,
      'Categoría encontrada',
    );
  },
);

export const crear = asyncHandler(
  async (req, res) => {
    const categoria =
      await categoriaService.crear(req.body);

    return successResponse(
      res,
      categoria,
      'Categoría creada correctamente',
      201,
    );
  },
);

export const actualizar = asyncHandler(
  async (req, res) => {
    const categoria =
      await categoriaService.actualizar(
        req.params.id,
        req.body,
      );

    return successResponse(
      res,
      categoria,
      'Categoría actualizada correctamente',
    );
  },
);

export const eliminar = asyncHandler(
  async (req, res) => {
    await categoriaService.eliminar(req.params.id);

    return successResponse(
      res,
      null,
      'Categoría eliminada correctamente',
    );
  },
);
