import * as clienteService from '../services/cliente.service.js';

import { BODEGA_CENTRAL_ID } from '../constants/logistica.js';

import {
  successResponse,
  errorResponse,
} from '../utils/apiResponse.js';

const capitalizarNombre = (nombre) => {
  return nombre
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

export const obtenerTodos = async (req, res) => {
  try {
    const clientes = await clienteService.obtenerTodos();

    return successResponse(
      res,
      clientes,
      'Clientes obtenidos correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await clienteService.obtenerPorId(id);

    if (!cliente) {
      return errorResponse(
        res,
        'Cliente no encontrado',
        404,
      );
    }

    return successResponse(
      res,
      cliente,
      'Cliente encontrado',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const crear = async (req, res) => {
  try {
    let {
      nombre,
      identificacion,
      telefono,
      correo,
      direccion,
      ubicacion_id,
    } = req.body;

    if (!nombre?.trim()) {
      return errorResponse(
        res,
        'El nombre es obligatorio',
        400,
      );
    }

    nombre = capitalizarNombre(nombre);

    const cedulaRegex = /^\d{10}$/;

    if (!cedulaRegex.test(identificacion)) {
      return errorResponse(
        res,
        'La identificación debe contener exactamente 10 dígitos',
        400,
      );
    }

    const existeCedula =
      await clienteService.existeIdentificacion(
        identificacion,
      );

    if (existeCedula) {
      return errorResponse(
        res,
        'La identificación ya se encuentra registrada',
        400,
      );
    }

    const telefonoRegex =
      /^(\+593\d{9}|0\d{9})$/;

    if (!telefonoRegex.test(telefono)) {
      return errorResponse(
        res,
        'Teléfono inválido',
        400,
      );
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(correo)) {
      return errorResponse(
        res,
        'Correo electrónico inválido',
        400,
      );
    }

    if (!direccion?.trim()) {
      return errorResponse(
        res,
        'La dirección es obligatoria',
        400,
      );
    }

    if (ubicacion_id === BODEGA_CENTRAL_ID) {
      return errorResponse(
        res,
        'La ubicación seleccionada es de uso interno',
        400,
      );
    }

    const ubicacion =
      await clienteService.existeUbicacion(
        ubicacion_id,
      );

    if (!ubicacion) {
      return errorResponse(
        res,
        'La ubicación especificada no existe',
        400,
      );
    }

    const cliente =
      await clienteService.crear({
        nombre,
        identificacion,
        telefono,
        correo,
        direccion,
        ubicacion_id,
      });

    return successResponse(
      res,
      cliente,
      'Cliente creado correctamente',
      201,
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const actualizar = async (req, res) => {
  try {
    const { id } = req.params;

    const clienteExistente =
      await clienteService.obtenerPorId(id);

    if (!clienteExistente) {
      return errorResponse(
        res,
        'Cliente no encontrado',
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
        capitalizarNombre(datos.nombre);
    }

    if (datos.identificacion !== undefined) {
      const cedulaRegex = /^\d{10}$/;

      if (
        !cedulaRegex.test(datos.identificacion)
      ) {
        return errorResponse(
          res,
          'La identificación debe contener exactamente 10 dígitos',
          400,
        );
      }

      const existeCedula =
        await clienteService.existeIdentificacion(
          datos.identificacion,
          id,
        );

      if (existeCedula) {
        return errorResponse(
          res,
          'La identificación ya se encuentra registrada',
          400,
        );
      }
    }

    if (datos.telefono !== undefined) {
      const telefonoRegex =
        /^(\+593\d{9}|0\d{9})$/;

      if (!telefonoRegex.test(datos.telefono)) {
        return errorResponse(
          res,
          'Teléfono inválido',
          400,
        );
      }
    }

    if (datos.correo !== undefined) {
      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(datos.correo)) {
        return errorResponse(
          res,
          'Correo electrónico inválido',
          400,
        );
      }
    }

    if (datos.ubicacion_id === BODEGA_CENTRAL_ID) {
      return errorResponse(
        res,
        'La ubicación seleccionada es de uso interno',
        400,
      );
    }

    if (datos.ubicacion_id !== undefined) {
      const ubicacion =
        await clienteService.existeUbicacion(
          datos.ubicacion_id,
        );

      if (!ubicacion) {
        return errorResponse(
          res,
          'La ubicación especificada no existe',
          400,
        );
      }
    }

    const cliente =
      await clienteService.actualizar(
        id,
        datos,
      );

    return successResponse(
      res,
      cliente,
      'Cliente actualizado correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    const eliminado =
      await clienteService.eliminar(id);

    if (!eliminado) {
      return errorResponse(
        res,
        'Cliente no encontrado',
        404,
      );
    }

    return successResponse(
      res,
      null,
      'Cliente eliminado correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
