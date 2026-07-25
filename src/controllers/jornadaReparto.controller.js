import * as jornadaRepartoService from '../services/jornadaReparto.service.js';

import {
  successResponse,
} from '../utils/apiResponse.js';

import {
  asyncHandler,
} from '../middlewares/asyncHandler.js';

export const generarJornadaReparto = asyncHandler(
  async (req, res) => {
    const resultado =
      await jornadaRepartoService.generarJornadaReparto(
        req.body,
      );

    return successResponse(
      res,
      resultado,
      'Jornada de reparto generada correctamente',
      201,
    );
  },
);

export const iniciarJornada = asyncHandler(
  async (req, res) => {
    const resultado =
      await jornadaRepartoService.iniciarJornada(
        req.params.id,
        req.user,
      );

    return successResponse(
      res,
      resultado,
      'Jornada de reparto iniciada correctamente',
    );
  },
);

export const avanzarJornada = asyncHandler(
  async (req, res) => {
    const resultado =
      await jornadaRepartoService.avanzarJornada(
        req.params.id,
      );

    return successResponse(
      res,
      resultado,
      'Posición de la jornada actualizada correctamente',
    );
  },
);

export const finalizarJornada = asyncHandler(
  async (req, res) => {
    const resultado =
      await jornadaRepartoService.finalizarJornada(
        req.params.id,
        req.user,
      );

    return successResponse(
      res,
      resultado,
      'Jornada de reparto finalizada correctamente',
    );
  },
);

export const obtenerJornadas = asyncHandler(
  async (req, res) => {
    const jornadas =
      await jornadaRepartoService.obtenerJornadas(
        req.user,
      );

    return successResponse(
      res,
      jornadas,
      'Jornadas de reparto obtenidas correctamente',
    );
  },
);

export const obtenerJornadaPorId = asyncHandler(
  async (req, res) => {
    const jornada =
      await jornadaRepartoService.obtenerJornadaPorId(
        req.params.id,
        req.user,
      );

    return successResponse(
      res,
      jornada,
      'Jornada de reparto obtenida correctamente',
    );
  },
);

export const recalcularJornada = asyncHandler(
  async (req, res) => {
    const resultado =
      await jornadaRepartoService.recalcularJornada(
        req.params.id,
      );

    return successResponse(
      res,
      resultado,
      'Jornada de reparto recalculada correctamente',
    );
  },
);

export const obtenerMapaGeneral = asyncHandler(
  async (req, res) => {
    const resultado =
      await jornadaRepartoService.obtenerMapaGeneral();

    return successResponse(
      res,
      resultado,
      'Mapa general de jornadas obtenido correctamente',
    );
  },
);

export const asignarChofer = asyncHandler(
  async (req, res) => {
    const jornada =
      await jornadaRepartoService.asignarChofer(
        req.params.id,
        req.body.chofer_id,
      );

    return successResponse(
      res,
      jornada,
      'Chofer asignado correctamente',
    );
  },
);

export const obtenerMisJornadas = asyncHandler(
  async (req, res) => {
    const jornadas =
      await jornadaRepartoService.obtenerJornadas(
        req.user,
      );

    return successResponse(
      res,
      jornadas,
      'Jornadas propias obtenidas correctamente',
    );
  },
);
