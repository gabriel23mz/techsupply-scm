import * as dashboardService
  from '../services/dashboard.service.js';

import {
  successResponse,
} from '../utils/apiResponse.js';

import {
  asyncHandler,
} from '../middlewares/asyncHandler.js';

export const obtenerResumen = asyncHandler(
  async (req, res) => {
    const resumen =
      await dashboardService.obtenerResumen(
        req.user,
      );

    return successResponse(
      res,
      resumen,
      'Resumen del dashboard obtenido correctamente',
    );
  },
);

export const obtenerNotificaciones = asyncHandler(
  async (req, res) => {
    const notificaciones =
      await dashboardService.obtenerNotificaciones(
        req.user,
        {
          limit: req.query.limit,
        },
      );

    return successResponse(
      res,
      notificaciones,
      'Notificaciones del dashboard obtenidas correctamente',
    );
  },
);
