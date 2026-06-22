import * as pedidoService from '../services/pedido.service.js';

import {
  successResponse,
  errorResponse,
} from '../utils/apiResponse.js';

const ESTADOS_CREACION = [
  'PENDIENTE',
  'PREPARANDO',
];

const ESTADOS_VALIDOS = [
  'PENDIENTE',
  'PREPARANDO',
  'DESPACHADO',
  'ENTREGADO',
  'CANCELADO',
];

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
    let {
      cliente_id,
      usuario_id,
      fecha,
      estado,
    } = req.body;

    const cliente =
      await pedidoService.existeCliente(
        cliente_id,
      );

    if (!cliente) {
      return errorResponse(
        res,
        'Cliente no válido',
        400,
      );
    }

    const usuario =
      await pedidoService.existeUsuario(
        usuario_id,
      );

    if (!usuario) {
      return errorResponse(
        res,
        'Usuario no válido',
        400,
      );
    }

    estado = estado || 'PENDIENTE';

    if (!ESTADOS_CREACION.includes(estado)) {
      return errorResponse(
        res,
        'No se puede crear un pedido con ese estado',
        400,
      );
    }

    const pedido =
      await pedidoService.crear({
        cliente_id,
        usuario_id,
        fecha: fecha || new Date(),
        estado,
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
        await pedidoService.existeCliente(
          datos.cliente_id,
        );

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
        await pedidoService.existeUsuario(
          datos.usuario_id,
        );

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
      datos.total = Number(datos.total);

      if (
        isNaN(datos.total) ||
        datos.total < 0
      ) {
        return errorResponse(
          res,
          'El total debe ser mayor o igual a cero',
          400,
        );
      }
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

    const eliminado =
      await pedidoService.eliminar(id);

    if (!eliminado) {
      return errorResponse(
        res,
        'Pedido no encontrado',
        404,
      );
    }

    return successResponse(
      res,
      null,
      'Pedido eliminado correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
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
