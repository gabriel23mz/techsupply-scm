import * as jornadaRepartoService from '../services/jornadaReparto.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';


export const generarJornadaReparto = async (req, res) => {
  try {
    const resultado = await jornadaRepartoService.generarJornadaReparto();

    return successResponse(
      res,
      resultado,
      'Jornada de reparto generada correctamente',
      201,
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Error al generar la jornada de reparto',
      400,
    );
  }
};

export const iniciarJornada = async (req, res) => {
  try {
    const resultado = await jornadaRepartoService.iniciarJornada(req.params.id);

    return successResponse(
      res,
      resultado,
      'Jornada de reparto iniciada correctamente',
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Error al iniciar la jornada de reparto',
      400,
    );
  }
};

export const avanzarJornada = async (req, res) => {
  try {
    const resultado = await jornadaRepartoService.avanzarJornada(req.params.id);

    return successResponse(
      res,
      resultado,
      'Posición de la jornada actualizada correctamente',
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Error al avanzar la jornada de reparto',
      400,
    );
  }
};

export const finalizarJornada = async (req, res) => {
  try {
    const resultado = await jornadaRepartoService.finalizarJornada(req.params.id);

    return successResponse(
      res,
      resultado,
      'Jornada de reparto finalizada correctamente',
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Error al finalizar la jornada de reparto',
      400,
    );
  }
};


export const obtenerJornadas = async (req, res) => {
  try {
    const jornadas = await jornadaRepartoService.obtenerJornadas();

    return successResponse(
      res,
      jornadas,
      'Jornadas de reparto obtenidas correctamente',
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Error al obtener las jornadas de reparto',
      400,
    );
  }
};

export const obtenerJornadaPorId = async (req, res) => {
  try {
    const jornada = await jornadaRepartoService.obtenerJornadaPorId(req.params.id);

    return successResponse(
      res,
      jornada,
      'Jornada de reparto obtenida correctamente',
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Error al obtener la jornada de reparto',
      400,
    );
  }
};

export const recalcularJornada = async (req, res) => {
  try {
    const resultado = await jornadaRepartoService.recalcularJornada(req.params.id);

    return successResponse(
      res,
      resultado,
      'Jornada de reparto recalculada correctamente',
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Error al recalcular la jornada',
      400,
    );
  }
};

export const obtenerMapaGeneral = async (
  req,
  res,
  next,
) => {
  try {
    const resultado =
      await jornadaRepartoService.obtenerMapaGeneral();

    return successResponse(
      res,
      resultado,
      'Mapa general de jornadas obtenido correctamente',
    );
  } catch (error) {
    next(error);
  }
};

