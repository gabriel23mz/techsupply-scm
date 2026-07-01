import * as despachoService from '../services/despacho.service.js';

import * as logisticaService from '../services/logistica.service.js';

import {
  successResponse,
  errorResponse,
} from '../utils/apiResponse.js';

export const obtenerTodos = async (req, res) => {
  try {
    const despachos =
        await despachoService.obtenerTodos();

    return successResponse(
      res,
      despachos,
      'Despachos obtenidos correctamente',
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
    );
  }
};

export const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const despacho =
        await despachoService.obtenerPorId(
          id,
        );

    if (!despacho) {
      return errorResponse(
        res,
        'Despacho no encontrado',
        404,
      );
    }

    return successResponse(
      res,
      despacho,
      'Despacho encontrado',
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
    );
  }
};

export const obtenerPedidosDisponibles = async (req, res) => {
  try {

    const pedidos =
        await logisticaService.obtenerPedidosDisponibles();

    return successResponse(
      res,
      pedidos,
      'Pedidos disponibles para despacho obtenidos correctamente',
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

    const { pedido_id } =
      req.body;

    const despacho =
      await logisticaService.crearDespacho(
        pedido_id,
      );

    return successResponse(
      res,
      despacho,
      'Despacho creado correctamente',
      201,
    );

  } catch (error) {

    return errorResponse(
      res,
      error.message,
    );

  }
};

export const iniciar = async (
  req,
  res,
) => {
  try {

    const { id } =
      req.params;

    const despacho =
      await logisticaService.iniciarDespacho(
        id,
      );

    return successResponse(
      res,
      despacho,
      'Despacho iniciado correctamente',
    );

  } catch (error) {

    return errorResponse(
      res,
      error.message,
    );

  }
};

export const entregar = async (
  req,
  res,
) => {
  try {

    const { id } =
      req.params;

    const despacho =
      await logisticaService.entregarDespacho(
        id,
      );

    return successResponse(
      res,
      despacho,
      'Despacho entregado correctamente',
    );

  } catch (error) {

    return errorResponse(
      res,
      error.message,
    );

  }
};

export const cancelar = async (
  req,
  res,
) => {
  try {

    const { id } =
      req.params;

    const despacho =
      await logisticaService.cancelarDespacho(
        id,
      );

    return successResponse(
      res,
      despacho,
      'Despacho cancelado correctamente',
    );

  } catch (error) {

    return errorResponse(
      res,
      error.message,
    );

  }
};
