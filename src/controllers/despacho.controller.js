import * as despachoService from '../services/despacho.service.js';
import * as pedidoService from '../services/pedido.service.js';

import {
  successResponse,
} from '../utils/apiResponse.js';

import {
  asyncHandler,
} from '../middlewares/asyncHandler.js';

export const obtenerTodos = asyncHandler(
  async (req, res) => {
    const despachos =
      await despachoService.obtenerTodos(req.user);

    return successResponse(
      res,
      despachos,
      'Despachos obtenidos correctamente',
    );
  },
);

export const obtenerPorId = asyncHandler(
  async (req, res) => {
    const despacho =
      await despachoService.obtenerPorId(
        req.params.id,
        req.user,
      );

    return successResponse(
      res,
      despacho,
      'Despacho encontrado',
    );
  },
);

export const obtenerPedidosDisponibles = asyncHandler(
  async (req, res) => {
    const pedidos =
      await pedidoService.obtenerPedidosDisponibles();

    return successResponse(
      res,
      pedidos,
      'Pedidos disponibles para despacho obtenidos correctamente',
    );
  },
);

export const entregarDespacho = asyncHandler(
  async (req, res) => {
    const resultado =
      await despachoService.entregarDespacho(
        req.params.id,
        req.user,
      );

    return successResponse(
      res,
      resultado,
      'Despacho entregado correctamente',
    );
  },
);

export const marcarNoEntregado = asyncHandler(
  async (req, res) => {
    const resultado =
      await despachoService.marcarNoEntregado(
        req.params.id,
        req.user,
      );

    return successResponse(
      res,
      resultado,
      'Despacho marcado como no entregado correctamente',
    );
  },
);
