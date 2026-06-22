import * as detallePedidoService from '../services/detallePedido.service.js';

import {
  successResponse,
  errorResponse,
} from '../utils/apiResponse.js';

export const obtenerTodos = async (
  req,
  res,
) => {
  try {
    const detalles =
      await detallePedidoService.obtenerTodos();

    return successResponse(
      res,
      detalles,
      'Detalles obtenidos correctamente',
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
    );
  }
};

export const obtenerPorId = async (
  req,
  res,
) => {
  try {
    const { id } = req.params;

    const detalle =
      await detallePedidoService.obtenerPorId(
        id,
      );

    if (!detalle) {
      return errorResponse(
        res,
        'Detalle no encontrado',
        404,
      );
    }

    return successResponse(
      res,
      detalle,
      'Detalle obtenido correctamente',
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
    );
  }
};

export const crear = async (
  req,
  res,
) => {
  try {
    const {
      pedido_id,
      producto_id,
      cantidad,
    } = req.body;

    if (!pedido_id) {
      return errorResponse(
        res,
        'pedido_id es obligatorio',
        400,
      );
    }

    if (!producto_id) {
      return errorResponse(
        res,
        'producto_id es obligatorio',
        400,
      );
    }

    if (
      !cantidad ||
      Number(cantidad) <= 0
    ) {
      return errorResponse(
        res,
        'Cantidad inválida',
        400,
      );
    }

    const detalle =
      await detallePedidoService.crear({
        pedido_id,
        producto_id,
        cantidad,
      });

    return successResponse(
      res,
      detalle,
      'Detalle creado correctamente',
      201,
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
    );
  }
};

export const actualizar = async (
  req,
  res,
) => {
  try {
    const { id } = req.params;

    if (
      req.body.cantidad !== undefined
    ) {
      const cantidad = Number(req.body.cantidad);

      if (
        Number.isNaN(cantidad) ||
        cantidad <= 0
      ) {
        return errorResponse(
          res,
          'La cantidad debe ser mayor a cero',
          400,
        );
      }
    }

    const detalle =
      await detallePedidoService.actualizar(
        id,
        req.body,
      );

    if (!detalle) {
      return errorResponse(
        res,
        'Detalle no encontrado',
        404,
      );
    }

    return successResponse(
      res,
      detalle,
      'Detalle actualizado correctamente',
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
    );
  }
};

export const eliminar = async (
  req,
  res,
) => {
  try {
    const { id } = req.params;

    const eliminado =
      await detallePedidoService.eliminar(
        id,
      );

    if (!eliminado) {
      return errorResponse(
        res,
        'Detalle no encontrado',
        404,
      );
    }

    return successResponse(
      res,
      null,
      'Detalle eliminado correctamente',
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
    );
  }
};
