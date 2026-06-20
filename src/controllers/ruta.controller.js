import * as rutaService from '../services/ruta.service.js';

import {
  successResponse,
  errorResponse,
} from '../utils/apiResponse.js';

export const obtenerTodas = async (req, res) => {
  try {
    const rutas = await rutaService.obtenerTodas();

    return successResponse(
      res,
      rutas,
      'Rutas obtenidas correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const ruta = await rutaService.obtenerPorId(id);

    if (!ruta) {
      return errorResponse(
        res,
        'Ruta no encontrada',
        404,
      );
    }

    return successResponse(
      res,
      ruta,
      'Ruta encontrada',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const crear = async (req, res) => {
  try {
    const {
      origen_id,
      destino_id,
      distancia_km,
    } = req.body;

    if (!origen_id || !destino_id) {
      return errorResponse(
        res,
        'Origen y destino son obligatorios',
        400,
      );
    }

    if (origen_id === destino_id) {
      return errorResponse(
        res,
        'Origen y destino no pueden ser iguales',
        400,
      );
    }

    const origen =
      await rutaService.existeUbicacion(origen_id);

    if (!origen) {
      return errorResponse(
        res,
        'La ubicación de origen no existe',
        400,
      );
    }

    const destino =
      await rutaService.existeUbicacion(destino_id);

    if (!destino) {
      return errorResponse(
        res,
        'La ubicación de destino no existe',
        400,
      );
    }

    const existeRuta =
      await rutaService.existeRuta(
        origen_id,
        destino_id,
      );

    if (existeRuta) {
      return errorResponse(
        res,
        'La ruta ya existe',
        400,
      );
    }

    const distancia = Number(distancia_km);

    if (isNaN(distancia) || distancia <= 0) {
      return errorResponse(
        res,
        'La distancia debe ser mayor que cero',
        400,
      );
    }

    const ruta = await rutaService.crear({
      origen_id,
      destino_id,
      distancia_km: distancia,
    });

    return successResponse(
      res,
      ruta,
      'Ruta creada correctamente',
      201,
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const actualizar = async (req, res) => {
  try {
    const { id } = req.params;

    const rutaExistente =
      await rutaService.obtenerPorId(id);

    if (!rutaExistente) {
      return errorResponse(
        res,
        'Ruta no encontrada',
        404,
      );
    }

    const datos = { ...req.body };

    const origenId =
      datos.origen_id ?? rutaExistente.origen_id;

    const destinoId =
      datos.destino_id ?? rutaExistente.destino_id;

    if (origenId === destinoId) {
      return errorResponse(
        res,
        'Origen y destino no pueden ser iguales',
        400,
      );
    }

    const origen =
      await rutaService.existeUbicacion(origenId);

    if (!origen) {
      return errorResponse(
        res,
        'La ubicación de origen no existe',
        400,
      );
    }

    const destino =
      await rutaService.existeUbicacion(destinoId);

    if (!destino) {
      return errorResponse(
        res,
        'La ubicación de destino no existe',
        400,
      );
    }

    const duplicada =
      await rutaService.existeRuta(
        origenId,
        destinoId,
        id,
      );

    if (duplicada) {
      return errorResponse(
        res,
        'La ruta ya existe',
        400,
      );
    }

    if (datos.distancia_km !== undefined) {
      const distancia =
        Number(datos.distancia_km);

      if (
        isNaN(distancia) ||
        distancia <= 0
      ) {
        return errorResponse(
          res,
          'La distancia debe ser mayor que cero',
          400,
        );
      }

      datos.distancia_km = distancia;
    }

    const ruta =
      await rutaService.actualizar(
        id,
        datos,
      );

    return successResponse(
      res,
      ruta,
      'Ruta actualizada correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    const eliminado =
      await rutaService.eliminar(id);

    if (!eliminado) {
      return errorResponse(
        res,
        'Ruta no encontrada',
        404,
      );
    }

    return successResponse(
      res,
      null,
      'Ruta eliminada correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
