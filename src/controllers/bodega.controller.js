import * as bodegaService from '../services/bodega.service.js';

import {
  successResponse,
} from '../utils/apiResponse.js';

import {
  asyncHandler,
} from '../middlewares/asyncHandler.js';

export const obtenerPedidosPreparacion = asyncHandler(
  async (req, res) => {
    const pedidos =
      await bodegaService.obtenerPedidosPreparacion();

    return successResponse(
      res,
      pedidos,
      'Pedidos en preparación obtenidos correctamente',
    );
  },
);

export const obtenerPedidoPreparacion = asyncHandler(
  async (req, res) => {
    const pedido =
      await bodegaService.obtenerPedidoPreparacion(
        req.params.id,
      );

    return successResponse(
      res,
      pedido,
      'Pedido en preparación obtenido correctamente',
    );
  },
);

export const actualizarPreparacionDetalle = asyncHandler(
  async (req, res) => {
    const detalle =
      await bodegaService.actualizarPreparacionDetalle(
        req.params.id,
        req.body.cantidad_preparada,
        req.user,
      );

    return successResponse(
      res,
      detalle,
      'Preparación actualizada correctamente',
    );
  },
);

export const finalizarPreparacion = asyncHandler(
  async (req, res) => {
    const pedido =
      await bodegaService.finalizarPreparacion(
        req.params.id,
        req.user,
      );

    return successResponse(
      res,
      pedido,
      'Preparación finalizada correctamente',
    );
  },
);

export const obtenerJornadasCarga = asyncHandler(
  async (req, res) => {
    const jornadas =
      await bodegaService.obtenerJornadasCarga();

    return successResponse(
      res,
      jornadas,
      'Jornadas para carga obtenidas correctamente',
    );
  },
);

export const obtenerJornadaCarga = asyncHandler(
  async (req, res) => {
    const jornada =
      await bodegaService.obtenerJornadaCarga(
        req.params.id,
      );

    return successResponse(
      res,
      jornada,
      'Carga de jornada obtenida correctamente',
    );
  },
);

export const actualizarCargaDespacho = asyncHandler(
  async (req, res) => {
    const despacho =
      await bodegaService.actualizarCargaDespacho(
        req.params.id,
        req.body.cargado,
        req.user,
      );

    return successResponse(
      res,
      despacho,
      'Carga de despacho actualizada correctamente',
    );
  },
);

export const confirmarCargaJornada = asyncHandler(
  async (req, res) => {
    const jornada =
      await bodegaService.confirmarCargaJornada(
        req.params.id,
        req.user,
      );

    return successResponse(
      res,
      jornada,
      'Carga confirmada correctamente',
    );
  },
);
