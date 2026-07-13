import * as ubicacionService from '../services/ubicacion.service.js';

import {
  successResponse,
  errorResponse,
} from '../utils/apiResponse.js';

/* -------------------------------------------------------------------------- */
/* Utilidades                                                                  */
/* -------------------------------------------------------------------------- */

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

const normalizarCoordenadas = (body) => {
  const {
    latitud,
    longitud,
  } = body;

  const tieneLatitud =
    latitud !== undefined &&
    latitud !== null &&
    latitud !== '';

  const tieneLongitud =
    longitud !== undefined &&
    longitud !== null &&
    longitud !== '';

  if (tieneLatitud !== tieneLongitud) {
    throw new Error(
      'La ubicación debe registrar latitud y longitud juntas',
    );
  }

  if (tieneLatitud) {
    const lat = Number(latitud);
    const lng = Number(longitud);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      throw new Error(
        'Las coordenadas deben ser numéricas',
      );
    }

    body.latitud = lat;
    body.longitud = lng;
  } else {
    body.latitud = null;
    body.longitud = null;
  }
};

/* -------------------------------------------------------------------------- */
/* GET                                                                         */
/* -------------------------------------------------------------------------- */

export const obtenerTodas = async (req, res) => {
  try {
    const ubicaciones =
      await ubicacionService.obtenerTodas();

    return successResponse(
      res,
      ubicaciones,
      'Ubicaciones obtenidas correctamente',
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

    const ubicacion =
      await ubicacionService.obtenerPorId(id);

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
    return errorResponse(
      res,
      error.message,
    );
  }
};

/* -------------------------------------------------------------------------- */
/* POST                                                                        */
/* -------------------------------------------------------------------------- */

export const crear = async (req, res) => {
  try {
    const {
      nombre,
    } = req.body;

    if (!nombre?.trim()) {
      return errorResponse(
        res,
        'El nombre es obligatorio',
        400,
      );
    }

    const nombreCapitalizado =
      capitalizarTexto(nombre);

    const existe =
      await ubicacionService.existePorNombre(
        nombreCapitalizado,
      );

    if (existe) {
      return errorResponse(
        res,
        'Ya existe una ubicación con ese nombre',
        400,
      );
    }

    normalizarCoordenadas(req.body);

    const nuevaUbicacion =
      await ubicacionService.crear({
        nombre: nombreCapitalizado,
        latitud: req.body.latitud,
        longitud: req.body.longitud,
        estado: true,
      });

    return successResponse(
      res,
      nuevaUbicacion,
      'Ubicación creada correctamente',
      201,
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message,
    );
  }
};

/* -------------------------------------------------------------------------- */
/* PUT                                                                         */
/* -------------------------------------------------------------------------- */

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

    normalizarCoordenadas(req.body);

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
    return errorResponse(
      res,
      error.message,
    );
  }
};

/* -------------------------------------------------------------------------- */
/* DELETE                                                                      */
/* -------------------------------------------------------------------------- */

export const eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    const eliminado =
      await ubicacionService.eliminar(id);

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
    return errorResponse(
      res,
      error.message,
    );
  }
};
