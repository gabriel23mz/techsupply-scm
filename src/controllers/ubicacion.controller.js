import * as ubicacionService from '../services/ubicacion.service.js';

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
    const ubicaciones = await ubicacionService.obtenerTodas();

    return successResponse(
      res,
      ubicaciones,
      'Ubicaciones obtenidas correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const ubicacion = await ubicacionService.obtenerPorId(id);

    if (!ubicacion) {
      return errorResponse(
        res,
        'Ubicación no encontrada',
        404,
      );
    }

    return successResponse(
      res,
      ubicacion,
      'Ubicación encontrada',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const crear = async (req, res) => {
  try {
    const { nombre, estado } = req.body;

    if (!nombre?.trim()) {
      return errorResponse(
        res,
        'El nombre es obligatorio',
        400,
      );
    }

    const nombreCapitalizado = capitalizarTexto(nombre);

    const existe = await ubicacionService.existePorNombre(nombreCapitalizado);

    if (existe) {
      return errorResponse(
        res,
        'Ya existe una ubicación con ese nombre',
        400,
      );
    }
    const nuevaUbicacion = await ubicacionService.crear({
      nombreCapitalizado,
      estado,
    });

    return successResponse(
      res,
      nuevaUbicacion,
      'Ubicación creada correctamente',
      201,
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const actualizar = async (req, res) => {
  try {
    const { id } = req.params;

    if (
      req.body.nombre !== undefined
    ) {
      if (!req.body.nombre.trim()) {
        return errorResponse(
          res,
          'El nombre no puede estar vacío',
          400,
        );
      }

      req.body.nombre =
        capitalizarTexto(
          req.body.nombre,
        );

      const existe =
        await ubicacionService.existePorNombre(
          req.body.nombre,
        );

      if (
        existe &&
        existe.id !== Number(id)
      ) {
        return errorResponse(
          res,
          'Ya existe una ubicación con ese nombre',
          400,
        );
      }
    }

    const ubicacion =
      await ubicacionService.actualizar(
        id,
        req.body,
      );

    if (!ubicacion) {
      return errorResponse(
        res,
        'Ubicación no encontrada',
        404,
      );
    }

    return successResponse(
      res,
      ubicacion,
      'Ubicación actualizada correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    const eliminado = await ubicacionService.eliminar(id);

    if (!eliminado) {
      return errorResponse(
        res,
        'Ubicación no encontrada',
        404,
      );
    }

    return successResponse(
      res,
      null,
      'Ubicación eliminada correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
