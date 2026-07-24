import * as clienteService from '../services/cliente.service.js';

import {
  successResponse,
} from '../utils/apiResponse.js';

import {
  asyncHandler,
} from '../middlewares/asyncHandler.js';

export const obtenerTodos = asyncHandler(
  async (req, res) => {
    const clientes =
      await clienteService.obtenerTodos();

    return successResponse(
      res,
      clientes,
      'Clientes obtenidos correctamente',
    );
  },
);

export const obtenerPorId = asyncHandler(
  async (req, res) => {
    const cliente =
      await clienteService.obtenerPorId(
        req.params.id,
      );

    return successResponse(
      res,
      cliente,
      'Cliente encontrado',
    );
  },
);

export const crear = asyncHandler(
  async (req, res) => {
    const cliente =
      await clienteService.crear(req.body);

    return successResponse(
      res,
      cliente,
      'Cliente creado correctamente',
      201,
    );
  },
);

export const actualizar = asyncHandler(
  async (req, res) => {
    const cliente =
      await clienteService.actualizar(
        req.params.id,
        req.body,
      );

    return successResponse(
      res,
      cliente,
      'Cliente actualizado correctamente',
    );
  },
);

export const eliminar = asyncHandler(
  async (req, res) => {
    await clienteService.eliminar(req.params.id);

    return successResponse(
      res,
      null,
      'Cliente eliminado correctamente',
    );
  },
);
