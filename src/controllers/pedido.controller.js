import * as pedidoService from '../services/pedido.service.js';

import * as usuarioService from '../services/usuario.service.js';

import * as clienteService from '../services/cliente.service.js';

import {
  successResponse,
  errorResponse,
} from '../utils/apiResponse.js';


export const obtenerTodos = async (req, res) => {
  try {
    const pedidos =
      await pedidoService.obtenerTodos();

    return successResponse(
      res,
      pedidos,
      'Pedidos obtenidos correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const pedido =
      await pedidoService.obtenerPorId(id);

    if (!pedido) {
      return errorResponse(
        res,
        'Pedido no encontrado',
        404,
      );
    }

    return successResponse(
      res,
      pedido,
      'Pedido encontrado',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const crear = async (req, res) => {
  try {
    const {
      cliente_id,
      usuario_id,
      fecha,
    } = req.body;

    const cliente =
      await clienteService.obtenerPorId(cliente_id);

    if (!cliente) {
      return errorResponse(
        res,
        'Cliente no válido',
        400,
      );
    }

    const usuario =
      await usuarioService.obtenerPorId(usuario_id);

    if (!usuario) {
      return errorResponse(
        res,
        'Usuario no válido',
        400,
      );
    }

    const pedido =
      await pedidoService.crear({
        cliente_id,
        usuario_id,
        fecha: fecha || new Date(),
        estado: 'PENDIENTE',
        total: 0,
      });

    const pedidoCreado =
      await pedidoService.obtenerPorId(
        pedido.id,
      );

    return successResponse(
      res,
      pedidoCreado,
      'Pedido creado correctamente',
      201,
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const actualizar = async (req, res) => {
  try {
    const { id } = req.params;

    const pedidoExistente =
      await pedidoService.obtenerPorId(id);

    if (!pedidoExistente) {
      return errorResponse(
        res,
        'Pedido no encontrado',
        404,
      );
    }

    const datos = { ...req.body };

    if (datos.cliente_id !== undefined) {
      const cliente =
        await clienteService.obtenerPorId(datos.cliente_id);

      if (!cliente) {
        return errorResponse(
          res,
          'Cliente no válido',
          400,
        );
      }
    }

    if (datos.usuario_id !== undefined) {
      const usuario =
        await usuarioService.obtenerPorId(datos.usuario_id);

      if (!usuario) {
        return errorResponse(
          res,
          'Usuario no válido',
          400,
        );
      }
    }

    if (datos.estado !== undefined) {
      return errorResponse(
        res,
        'Utilice los endpoints de flujo para modificar estados',
        400,
      );
    }

    if (datos.total !== undefined) {
      return errorResponse(
        res,
        'El total es calculado automáticamente por el sistema',
        400,
      );
    }

    const pedido =
      await pedidoService.actualizar(
        id,
        datos,
      );

    return successResponse(
      res,
      pedido,
      'Pedido actualizado correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    await pedidoService.eliminar(id);

    return successResponse(
      res,
      null,
      'Pedido eliminado correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
};

export const preparar = async (req, res) => {
  try {
    const { id } = req.params;

    const pedido =
      await pedidoService.preparar(id);

    if (!pedido) {
      return errorResponse(
        res,
        'Pedido no encontrado',
        404,
      );
    }

    return successResponse(
      res,
      pedido,
      'Pedido preparado correctamente',
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
      400,
    );
  }
};

export const finalizarPreparacion = async (
  req,
  res,
) => {
  try {
    const { id } = req.params;

    const pedido =
      await pedidoService.finalizarPreparacion(id);

    if (!pedido) {
      return errorResponse(
        res,
        'Pedido no encontrado',
        404,
      );
    }

    return successResponse(
      res,
      pedido,
      'Pedido listo para despacho',
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
      400,
    );
  }
};

export const cancelar = async (
  req,
  res,
) => {
  try {
    const { id } = req.params;

    const pedido =
      await pedidoService.cancelar(id);

    if (!pedido) {
      return errorResponse(
        res,
        'Pedido no encontrado',
        404,
      );
    }

    return successResponse(
      res,
      pedido,
      'Pedido cancelado correctamente',
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
      400,
    );
  }
};
