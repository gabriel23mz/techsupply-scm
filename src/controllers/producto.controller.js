import * as productoService from '../services/producto.service.js';

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

export const obtenerTodos = async (req, res) => {
  try {
    const productos =
      await productoService.obtenerTodos();

    return successResponse(
      res,
      productos,
      'Productos obtenidos correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const producto =
      await productoService.obtenerPorId(id);

    if (!producto) {
      return errorResponse(
        res,
        'Producto no encontrado',
        404,
      );
    }

    return successResponse(
      res,
      producto,
      'Producto encontrado',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const crear = async (req, res) => {
  try {
    let {
      categoria_id,
      codigo,
      nombre,
      descripcion,
      precio_compra,
      precio_venta,
      stock_actual,
      stock_minimo,
    } = req.body;

    const categoria =
      await productoService.existeCategoria(
        categoria_id,
      );

    if (!categoria) {
      return errorResponse(
        res,
        'La categoría especificada no existe',
        400,
      );
    }

    codigo = codigo?.trim().toUpperCase();

    if (!codigo) {
      return errorResponse(
        res,
        'El código es obligatorio',
        400,
      );
    }

    const existeCodigo =
      await productoService.existeCodigo(
        codigo,
      );

    if (existeCodigo) {
      return errorResponse(
        res,
        'El código ya existe',
        400,
      );
    }

    if (!nombre?.trim()) {
      return errorResponse(
        res,
        'El nombre es obligatorio',
        400,
      );
    }

    nombre = capitalizarTexto(nombre);

    precio_compra = Number(precio_compra);
    precio_venta = Number(precio_venta);

    if (
      isNaN(precio_compra) ||
      precio_compra <= 0
    ) {
      return errorResponse(
        res,
        'Precio de compra inválido',
        400,
      );
    }

    if (
      isNaN(precio_venta) ||
      precio_venta <= 0
    ) {
      return errorResponse(
        res,
        'Precio de venta inválido',
        400,
      );
    }

    if (precio_venta < precio_compra) {
      return errorResponse(
        res,
        'El precio de venta no puede ser menor al precio de compra',
        400,
      );
    }

    stock_actual = Number(stock_actual ?? 0);
    stock_minimo = Number(stock_minimo ?? 5);

    if (stock_actual < 0) {
      return errorResponse(
        res,
        'El stock actual no puede ser negativo',
        400,
      );
    }

    if (stock_minimo < 0) {
      return errorResponse(
        res,
        'El stock mínimo no puede ser negativo',
        400,
      );
    }

    const producto =
      await productoService.crear({
        categoria_id,
        codigo,
        nombre,
        descripcion:
          descripcion?.trim() || null,
        precio_compra,
        precio_venta,
        stock_actual,
        stock_minimo,
      });

    return successResponse(
      res,
      producto,
      'Producto creado correctamente',
      201,
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const actualizar = async (req, res) => {
  try {
    const { id } = req.params;

    const productoExistente =
      await productoService.obtenerPorId(id);

    if (!productoExistente) {
      return errorResponse(
        res,
        'Producto no encontrado',
        404,
      );
    }

    const datos = { ...req.body };

    if (datos.categoria_id !== undefined) {
      const categoria =
        await productoService.existeCategoria(
          datos.categoria_id,
        );

      if (!categoria) {
        return errorResponse(
          res,
          'La categoría especificada no existe',
          400,
        );
      }
    }

    if (datos.codigo !== undefined) {
      datos.codigo =
        datos.codigo.trim().toUpperCase();

      const existeCodigo =
        await productoService.existeCodigo(
          datos.codigo,
          id,
        );

      if (existeCodigo) {
        return errorResponse(
          res,
          'El código ya existe',
          400,
        );
      }
    }

    if (datos.nombre !== undefined) {
      datos.nombre =
        capitalizarTexto(datos.nombre);
    }

    if (
      datos.precio_compra !== undefined ||
      datos.precio_venta !== undefined
    ) {
      const compra =
        Number(
          datos.precio_compra ??
            productoExistente.precio_compra,
        );

      const venta =
        Number(
          datos.precio_venta ??
            productoExistente.precio_venta,
        );

      if (venta < compra) {
        return errorResponse(
          res,
          'El precio de venta no puede ser menor al precio de compra',
          400,
        );
      }
    }

    const producto =
      await productoService.actualizar(
        id,
        datos,
      );

    return successResponse(
      res,
      producto,
      'Producto actualizado correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    const eliminado =
      await productoService.eliminar(id);

    if (!eliminado) {
      return errorResponse(
        res,
        'Producto no encontrado',
        404,
      );
    }

    return successResponse(
      res,
      null,
      'Producto eliminado correctamente',
    );
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
