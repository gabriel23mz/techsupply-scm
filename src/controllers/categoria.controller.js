import * as categoriaService from '../services/categoria.service.js';

import {
  successResponse,
  errorResponse,
} from '../utils/apiResponse.js';

const capitalizarTexto = (texto) => {
  return texto
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(
      (palabra) =>
        palabra.charAt(0).toUpperCase() +
        palabra.slice(1),
    )
    .join(' ');
};

export const obtenerTodas = async (req, res) => {
  try {
    const categorias =
      await categoriaService.obtenerTodas();

    return successResponse(
      res,
      categorias,
      'Categorías obtenidas correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const categoria =
      await categoriaService.obtenerPorId(id);

    if (!categoria) {
      return errorResponse(
        res,
        'Categoría no encontrada',
        404,
      );
    }

    return successResponse(
      res,
      categoria,
      'Categoría encontrada',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const crear = async (req, res) => {
  try {
    let { nombre, descripcion } = req.body;

    if (!nombre?.trim()) {
      return errorResponse(
        res,
        'El nombre es obligatorio',
        400,
      );
    }

    nombre = capitalizarTexto(nombre);

    const existeNombre =
      await categoriaService.existeNombre(
        nombre,
      );

    if (existeNombre) {
      return errorResponse(
        res,
        'La categoría ya existe',
        400,
      );
    }

    const categoria =
      await categoriaService.crear({
        nombre,
        descripcion:
          descripcion?.trim() || null,
      });

    return successResponse(
      res,
      categoria,
      'Categoría creada correctamente',
      201,
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const actualizar = async (req, res) => {
  try {
    const { id } = req.params;

    const categoriaExistente =
      await categoriaService.obtenerPorId(id);

    if (!categoriaExistente) {
      return errorResponse(
        res,
        'Categoría no encontrada',
        404,
      );
    }

    const datos = { ...req.body };

    if (datos.nombre !== undefined) {
      if (!datos.nombre.trim()) {
        return errorResponse(
          res,
          'El nombre no puede estar vacío',
          400,
        );
      }

      datos.nombre =
        capitalizarTexto(datos.nombre);

      const existeNombre =
        await categoriaService.existeNombre(
          datos.nombre,
          id,
        );

      if (existeNombre) {
        return errorResponse(
          res,
          'La categoría ya existe',
          400,
        );
      }
    }

    if (datos.descripcion !== undefined) {
      datos.descripcion =
        datos.descripcion?.trim() || null;
    }

    const categoria =
      await categoriaService.actualizar(
        id,
        datos,
      );

    return successResponse(
      res,
      categoria,
      'Categoría actualizada correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    const eliminado =
      await categoriaService.eliminar(id);

    if (!eliminado) {
      return errorResponse(
        res,
        'Categoría no encontrada',
        404,
      );
    }

    return successResponse(
      res,
      null,
      'Categoría eliminada correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
