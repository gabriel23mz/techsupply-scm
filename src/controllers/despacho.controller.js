import * as despachoService from '../services/despacho.service.js';
import * as logisticaService from '../services/logistica.service.js';

import {
  successResponse,
} from '../utils/apiResponse.js';

import {
  asyncHandler,
} from '../middlewares/asyncHandler.js';

export const obtenerTodos = asyncHandler(
  async (req, res) => {
    const despachos =
      await despachoService.obtenerTodos();

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
      await logisticaService.obtenerPedidosDisponibles();

    return successResponse(
      res,
      pedidos,
      'Pedidos disponibles para despacho obtenidos correctamente',
    );
  },
);

export const crear = asyncHandler(
  async (req, res) => {
    const despacho =
      await logisticaService.crearDespacho(
        req.body.pedido_id,
      );

    return successResponse(
      res,
      despacho,
      'Despacho creado correctamente',
      201,
    );
  },
);

export const iniciar = asyncHandler(
  async (req, res) => {
    const despacho =
      await logisticaService.iniciarDespacho(
        req.params.id,
      );

    return successResponse(
      res,
      despacho,
      'Despacho iniciado correctamente',
    );
  },
);

export const entregar = asyncHandler(
  async (req, res) => {
    const despacho =
      await logisticaService.entregarDespacho(
        req.params.id,
      );

    return successResponse(
      res,
      despacho,
      'Despacho entregado correctamente',
    );
  },
);

export const cancelar = asyncHandler(
  async (req, res) => {
    const despacho =
      await logisticaService.cancelarDespacho(
        req.params.id,
      );

    return successResponse(
      res,
      despacho,
      'Despacho cancelado correctamente',
    );
  },
);

export const entregarDespacho = asyncHandler(
  async (req, res) => {
    const resultado =
      await despachoService.entregarDespacho(
        req.params.id,
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
      );

    return successResponse(
      res,
      resultado,
      'Despacho marcado como no entregado correctamente',
    );
  },
);
