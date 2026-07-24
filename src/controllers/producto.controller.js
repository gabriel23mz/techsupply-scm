import * as productoService from '../services/producto.service.js';

import {
  successResponse,
} from '../utils/apiResponse.js';

import {
  asyncHandler,
} from '../middlewares/asyncHandler.js';

export const obtenerTodos = asyncHandler(
  async (req, res) => {
    const productos =
      await productoService.obtenerTodos();

    return successResponse(
      res,
      productos,
      'Productos obtenidos correctamente',
    );
  },
);

export const obtenerPorId = asyncHandler(
  async (req, res) => {
    const producto =
      await productoService.obtenerPorId(
        req.params.id,
      );

    return successResponse(
      res,
      producto,
      'Producto encontrado',
    );
  },
);

export const crear = asyncHandler(
  async (req, res) => {
    const producto =
      await productoService.crear(req.body);

    return successResponse(
      res,
      producto,
      'Producto creado correctamente',
      201,
    );
  },
);

export const actualizar = asyncHandler(
  async (req, res) => {
    const producto =
      await productoService.actualizar(
        req.params.id,
        req.body,
      );

    return successResponse(
      res,
      producto,
      'Producto actualizado correctamente',
    );
  },
);

export const eliminar = asyncHandler(
  async (req, res) => {
    await productoService.eliminar(req.params.id);

    return successResponse(
      res,
      null,
      'Producto eliminado correctamente',
    );
  },
);
