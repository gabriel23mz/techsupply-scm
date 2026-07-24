import * as pedidoService from '../services/pedido.service.js';

import {
  successResponse,
} from '../utils/apiResponse.js';

import {
  asyncHandler,
} from '../middlewares/asyncHandler.js';

export const obtenerTodos = asyncHandler(
  async (req, res) => {
    const pedidos =
      await pedidoService.obtenerTodos(req.user);

    return successResponse(
      res,
      pedidos,
      'Pedidos obtenidos correctamente',
    );
  },
);

export const obtenerPorId = asyncHandler(
  async (req, res) => {
    const pedido =
      await pedidoService.obtenerPorId(
        req.params.id,
        req.user,
      );

    return successResponse(
      res,
      pedido,
      'Pedido encontrado',
    );
  },
);

export const crear = asyncHandler(
  async (req, res) => {
    const pedido =
      await pedidoService.crear(
        req.body,
        req.user,
      );

    return successResponse(
      res,
      pedido,
      'Pedido creado correctamente',
      201,
    );
  },
);

export const actualizar = asyncHandler(
  async (req, res) => {
    const pedido =
      await pedidoService.actualizar(
        req.params.id,
        req.body,
        req.user,
      );

    return successResponse(
      res,
      pedido,
      'Pedido actualizado correctamente',
    );
  },
);

export const eliminar = asyncHandler(
  async (req, res) => {
    await pedidoService.eliminar(req.params.id);

    return successResponse(
      res,
      null,
      'Pedido eliminado correctamente',
    );
  },
);

export const preparar = asyncHandler(
  async (req, res) => {
    const pedido =
      await pedidoService.preparar(
        req.params.id,
        req.user,
      );

    return successResponse(
      res,
      pedido,
      'Pedido preparado correctamente',
    );
  },
);

export const finalizarPreparacion = asyncHandler(
  async (req, res) => {
    const pedido =
      await pedidoService.finalizarPreparacion(
        req.params.id,
        req.user,
      );

    return successResponse(
      res,
      pedido,
      'Pedido listo para despacho',
    );
  },
);

export const cancelar = asyncHandler(
  async (req, res) => {
    const pedido =
      await pedidoService.cancelar(
        req.params.id,
        req.user,
      );

    return successResponse(
      res,
      pedido,
      'Pedido cancelado correctamente',
    );
  },
);
