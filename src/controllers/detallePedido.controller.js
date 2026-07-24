import * as detallePedidoService from '../services/detallePedido.service.js';

import {
  successResponse,
} from '../utils/apiResponse.js';

import {
  asyncHandler,
} from '../middlewares/asyncHandler.js';

export const obtenerTodos = asyncHandler(
  async (req, res) => {
    const detalles =
      await detallePedidoService.obtenerTodos();

    return successResponse(
      res,
      detalles,
      'Detalles obtenidos correctamente',
    );
  },
);

export const obtenerPorId = asyncHandler(
  async (req, res) => {
    const detalle =
      await detallePedidoService.obtenerPorId(
        req.params.id,
      );

    return successResponse(
      res,
      detalle,
      'Detalle obtenido correctamente',
    );
  },
);

export const crear = asyncHandler(
  async (req, res) => {
    const detalle =
      await detallePedidoService.crear(
        req.body,
        req.user,
      );

    return successResponse(
      res,
      detalle,
      'Detalle creado correctamente',
      201,
    );
  },
);

export const actualizar = asyncHandler(
  async (req, res) => {
    const detalle =
      await detallePedidoService.actualizar(
        req.params.id,
        req.body,
        req.user,
      );

    return successResponse(
      res,
      detalle,
      'Detalle actualizado correctamente',
    );
  },
);

export const eliminar = asyncHandler(
  async (req, res) => {
    await detallePedidoService.eliminar(
        req.params.id,
        req.user,
      );

    return successResponse(
      res,
      null,
      'Detalle eliminado correctamente',
    );
  },
);
