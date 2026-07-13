import * as camionService from '../services/camion.service.js';

import {
  errorResponse,
  successResponse,
} from '../utils/apiResponse.js';

/*
|--------------------------------------------------------------------------
| GET /api/camiones
|--------------------------------------------------------------------------
*/

export const obtenerTodos = async (
  req,
  res,
) => {
  try {
    const camiones =
      await camionService.obtenerTodos();

    return successResponse(
      res,
      camiones,
      'Camiones obtenidos correctamente',
    );
  } catch (error) {
    console.error(
      'Error al obtener camiones:',
      error,
    );

    return errorResponse(
      res,
      error.message ||
        'No fue posible obtener los camiones',
    );
  }
};

/*
|--------------------------------------------------------------------------
| GET /api/camiones/:id
|--------------------------------------------------------------------------
*/

export const obtenerPorId = async (
  req,
  res,
) => {
  try {
    const { id } = req.params;

    const camion =
      await camionService.obtenerPorId(id);

    if (!camion) {
      return errorResponse(
        res,
        'Camión no encontrado',
        404,
      );
    }

    return successResponse(
      res,
      camion,
      'Camión obtenido correctamente',
    );
  } catch (error) {
    console.error(
      'Error al obtener el camión:',
      error,
    );

    return errorResponse(
      res,
      error.message ||
        'No fue posible obtener el camión',
    );
  }
};

