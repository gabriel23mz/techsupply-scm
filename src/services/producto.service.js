import Producto from '../models/Producto.js';
import Categoria from '../models/Categoria.js';

import {
  BusinessRuleError,
  ConflictError,
  NotFoundError,
} from '../utils/errors.js';

const capitalizarTexto = (texto) =>
  texto
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(
      (palabra) =>
        palabra.charAt(0).toUpperCase() +
        palabra.slice(1),
    )
    .join(' ');

const normalizarDatos = (
  datos,
  defaults = false,
) => {
  const normalizados = { ...datos };

  if (normalizados.codigo !== undefined) {
    normalizados.codigo =
      normalizados.codigo.trim().toUpperCase();
  }

  if (normalizados.nombre !== undefined) {
    normalizados.nombre =
      capitalizarTexto(normalizados.nombre);
  }

  if (normalizados.descripcion !== undefined) {
    normalizados.descripcion =
      normalizados.descripcion?.trim() || null;
  }

  for (const campo of [
    'precio_compra',
    'precio_venta',
    'stock_actual',
    'stock_minimo',
  ]) {
    if (normalizados[campo] !== undefined) {
      normalizados[campo] = Number(
        normalizados[campo],
      );
    }
  }

  if (
    defaults &&
    normalizados.stock_actual === undefined
  ) {
    normalizados.stock_actual = 0;
  }

  if (
    defaults &&
    normalizados.stock_minimo === undefined
  ) {
    normalizados.stock_minimo = 5;
  }

  return normalizados;
};

const validarCategoria = async (
  categoriaId,
) => {
  if (categoriaId === undefined) {
    return;
  }

  const categoria =
    await existeCategoria(categoriaId);

  if (!categoria) {
    throw new BusinessRuleError(
      'La categoría especificada no existe',
      'CATEGORIA_NO_EXISTE',
    );
  }
};

const validarPrecios = (
  datos,
  productoExistente = {},
) => {
  const compra = Number(
    datos.precio_compra ??
      productoExistente.precio_compra,
  );

  const venta = Number(
    datos.precio_venta ??
      productoExistente.precio_venta,
  );

  if (venta < compra) {
    throw new BusinessRuleError(
      'El precio de venta no puede ser menor al precio de compra',
      'PRECIO_VENTA_MENOR_COMPRA',
    );
  }
};

export const obtenerTodos = async () => {
  return await Producto.findAll({
    where: {
      estado: true,
    },
    include: [
      {
        model: Categoria,
        attributes: ['id', 'nombre'],
      },
    ],
    order: [['id', 'ASC']],
  });
};

export const obtenerPorId = async (id) => {
  const producto = await Producto.findOne({
    where: {
      id,
      estado: true,
    },
    include: [
      {
        model: Categoria,
        attributes: ['id', 'nombre'],
      },
    ],
  });

  if (!producto) {
    throw new NotFoundError(
      'Producto no encontrado',
      'PRODUCTO_NO_ENCONTRADO',
    );
  }

  return producto;
};

export const crear = async (datos) => {
  const datosNormalizados =
    normalizarDatos(datos, true);

  await validarCategoria(
    datosNormalizados.categoria_id,
  );

  if (
    await existeCodigo(datosNormalizados.codigo)
  ) {
    throw new ConflictError(
      'El código ya existe',
      'PRODUCTO_CODIGO_DUPLICADO',
    );
  }

  validarPrecios(datosNormalizados);

  return await Producto.create(datosNormalizados);
};

export const actualizar = async (id, datos) => {
  const productoExistente = await obtenerPorId(id);
  const datosNormalizados = normalizarDatos(datos);

  await validarCategoria(
    datosNormalizados.categoria_id,
  );

  if (
    datosNormalizados.codigo !== undefined &&
    await existeCodigo(
      datosNormalizados.codigo,
      id,
    )
  ) {
    throw new ConflictError(
      'El código ya existe',
      'PRODUCTO_CODIGO_DUPLICADO',
    );
  }

  if (
    datosNormalizados.precio_compra !== undefined ||
    datosNormalizados.precio_venta !== undefined
  ) {
    validarPrecios(
      datosNormalizados,
      productoExistente,
    );
  }

  await productoExistente.update(
    datosNormalizados,
  );

  return await obtenerPorId(id);
};

export const eliminar = async (id) => {
  const producto = await obtenerPorId(id);

  await producto.update({
    estado: false,
  });

  return true;
};

export const existeCategoria = async (categoriaId) => {
  return await Categoria.findOne({
    where: {
      id: categoriaId,
      estado: true,
    },
  });
};

export const existeCodigo = async (
  codigo,
  idExcluir = null,
) => {
  const producto = await Producto.findOne({
    where: {
      codigo,
    },
  });

  if (!producto) {
    return false;
  }

  if (
    idExcluir &&
    producto.id === Number(idExcluir)
  ) {
    return false;
  }

  return true;
};
