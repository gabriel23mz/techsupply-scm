import * as choferService from '../services/chofer.service.js';

import {
  successResponse,
} from '../utils/apiResponse.js';

import {
  asyncHandler,
} from '../middlewares/asyncHandler.js';

export const obtenerTodos = asyncHandler(
  async (req, res) => {
    const choferes =
      await choferService.obtenerTodos(req.user);

    return successResponse(
      res,
      choferes,
      'Choferes obtenidos correctamente',
    );
  },
);

export const obtenerDisponibles = asyncHandler(
  async (req, res) => {
    const choferes =
      await choferService.obtenerDisponibles();

    return successResponse(
      res,
      choferes,
      'Choferes disponibles obtenidos correctamente',
    );
  },
);

export const obtenerPorId = asyncHandler(
  async (req, res) => {
    const chofer =
      await choferService.obtenerPorId(
        req.params.id,
        req.user,
      );

    return successResponse(
      res,
      chofer,
      'Chofer obtenido correctamente',
    );
  },
);

export const crear = asyncHandler(
  async (req, res) => {
    const chofer =
      await choferService.crear(req.body);

    return successResponse(
      res,
      chofer,
      'Chofer creado correctamente',
      201,
    );
  },
);

export const actualizar = asyncHandler(
  async (req, res) => {
    const chofer =
      await choferService.actualizar(
        req.params.id,
        req.body,
      );

    return successResponse(
      res,
      chofer,
      'Chofer actualizado correctamente',
    );
  },
);

export const eliminar = asyncHandler(
  async (req, res) => {
    const chofer =
      await choferService.eliminar(
        req.params.id,
        req.user,
      );

    return successResponse(
      res,
      chofer,
      'Chofer desactivado correctamente',
    );
  },
);
