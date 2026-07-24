import Pedido from '../models/Pedido.js';
import Cliente from '../models/Cliente.js';
import Usuario from '../models/Usuario.js';
import DetallePedido from '../models/DetallePedido.js';
import Producto from '../models/Producto.js';

import {
  BusinessRuleError,
  NotFoundError,
} from '../utils/errors.js';

const pedidoRelations = [
  {
    model: Cliente,
    as: 'cliente',
    attributes: [
      'id',
      'nombre',
      'ubicacion_id',
    ],
  },
  {
    model: Usuario,
    as: 'usuario',
    attributes: [
      'id',
      'nombre',
      'apellido',
      'correo',
      'rol',
    ],
  },
];

const pedidoRelationsDetalle = [
  ...pedidoRelations,
  {
    model: DetallePedido,
    as: 'detalles',
    include: [
      {
        model: Producto,
        as: 'producto',
        attributes: [
          'id',
          'nombre',
          'precio_venta',
        ],
      },
    ],
  },
];

const obtenerPedidoBase = async (id) => {
  const pedido = await Pedido.findByPk(id);

  if (!pedido) {
    throw new NotFoundError(
      'Pedido no encontrado',
      'PEDIDO_NO_ENCONTRADO',
    );
  }

  return pedido;
};

const validarCliente = async (clienteId) => {
  if (clienteId === undefined) {
    return;
  }

  const cliente = await Cliente.findOne({
    where: {
      id: clienteId,
      estado: true,
    },
  });

  if (!cliente) {
    throw new BusinessRuleError(
      'Cliente no válido',
      'CLIENTE_INVALIDO',
    );
  }
};

const validarUsuario = async (usuarioId) => {
  if (usuarioId === undefined) {
    return;
  }

  const usuario = await Usuario.findOne({
    where: {
      id: usuarioId,
      estado: true,
    },
  });

  if (!usuario) {
    throw new BusinessRuleError(
      'Usuario no válido',
      'USUARIO_INVALIDO',
    );
  }
};

export const obtenerTodos = async () => {
  return await Pedido.findAll({
    include: pedidoRelations,
    order: [['id', 'ASC']],
  });
};

export const obtenerPorId = async (id) => {
  const pedido = await Pedido.findByPk(id, {
    include: pedidoRelationsDetalle,
  });

  if (!pedido) {
    throw new NotFoundError(
      'Pedido no encontrado',
      'PEDIDO_NO_ENCONTRADO',
    );
  }

  return pedido;
};

export const crear = async (datos) => {
  await validarCliente(datos.cliente_id);
  await validarUsuario(datos.usuario_id);

  const pedido = await Pedido.create({
    cliente_id: datos.cliente_id,
    usuario_id: datos.usuario_id,
    fecha: datos.fecha || new Date(),
    estado: 'PENDIENTE',
    total: 0,
  });

  return await obtenerPorId(pedido.id);
};

export const actualizar = async (id, datos) => {
  const pedido = await obtenerPedidoBase(id);

  if (
    pedido.estado !== 'PENDIENTE' &&
    pedido.estado !== 'PREPARANDO'
  ) {
    throw new BusinessRuleError(
      'Solo se pueden modificar pedidos pendientes o en preparación',
      'PEDIDO_NO_MODIFICABLE',
    );
  }

  if (datos.estado !== undefined) {
    throw new BusinessRuleError(
      'Utilice los endpoints de flujo para modificar estados',
      'PEDIDO_ESTADO_SOLO_FLUJO',
    );
  }

  if (datos.total !== undefined) {
    throw new BusinessRuleError(
      'El total es calculado automáticamente por el sistema',
      'PEDIDO_TOTAL_AUTOMATICO',
    );
  }

  await validarCliente(datos.cliente_id);
  await validarUsuario(datos.usuario_id);

  await pedido.update(datos);

  return await obtenerPorId(id);
};

export const eliminar = async (id) => {
  await obtenerPedidoBase(id);

  throw new BusinessRuleError(
    'La eliminación de pedidos no está permitida. Utilice el endpoint de cancelación.',
    'PEDIDO_ELIMINACION_NO_PERMITIDA',
  );
};

export const preparar = async (id) => {
  const pedido = await obtenerPedidoBase(id);

  if (pedido.estado !== 'PENDIENTE') {
    throw new BusinessRuleError(
      'Solo los pedidos PENDIENTES pueden prepararse',
      'PEDIDO_ESTADO_INVALIDO_PREPARAR',
    );
  }

  await pedido.update({
    estado: 'PREPARANDO',
  });

  return await obtenerPorId(id);
};

export const finalizarPreparacion = async (id) => {
  const pedido = await obtenerPedidoBase(id);

  if (pedido.estado !== 'PREPARANDO') {
    throw new BusinessRuleError(
      'Solo los pedidos en PREPARANDO pueden finalizar la preparación',
      'PEDIDO_ESTADO_INVALIDO_FINALIZAR_PREPARACION',
    );
  }

  const detalles =
    await DetallePedido.findAll({
      where: {
        pedido_id: id,
      },
    });

  if (detalles.length === 0) {
    throw new BusinessRuleError(
      'El pedido debe tener al menos un producto antes de quedar listo para despacho',
      'PEDIDO_SIN_DETALLES',
    );
  }

  await pedido.update({
    estado: 'LISTO_PARA_DESPACHO',
  });

  return await obtenerPorId(id);
};

export const cancelar = async (id) => {
  const pedido = await obtenerPedidoBase(id);

  if (
    pedido.estado !== 'PENDIENTE' &&
    pedido.estado !== 'PREPARANDO' &&
    pedido.estado !== 'LISTO_PARA_DESPACHO'
  ) {
    throw new BusinessRuleError(
      'Solo se pueden cancelar pedidos pendientes, en preparación o listos para despacho',
      'PEDIDO_NO_CANCELABLE',
    );
  }

  const detalles =
    await DetallePedido.findAll({
      where: {
        pedido_id: id,
      },
    });

  for (const detalle of detalles) {
    const producto =
      await Producto.findByPk(
        detalle.producto_id,
      );

    if (producto) {
      await producto.update({
        stock_actual:
          producto.stock_actual +
          Number(detalle.cantidad),
      });
    }
  }

  await pedido.update({
    estado: 'CANCELADO',
  });

  return await obtenerPorId(id);
};

export const pedidoTieneDetalles = async (pedidoId) => {
  const cantidad =
    await DetallePedido.count({
      where: {
        pedido_id: pedidoId,
      },
    });

  return cantidad > 0;
};

export const sincronizarEstadoConDespacho = async (
  pedidoId,
  evento,
) => {
  const pedido = await Pedido.findByPk(
    pedidoId,
  );

  if (!pedido) {
    throw new NotFoundError(
      'Pedido no encontrado',
      'PEDIDO_NO_ENCONTRADO',
    );
  }

  let nuevoEstado;

  switch (evento) {
  case 'DESPACHO_CREADO':
    nuevoEstado = 'DESPACHADO';
    break;

  case 'DESPACHO_ENTREGADO':
    nuevoEstado = 'ENTREGADO';
    break;

  case 'DESPACHO_CANCELADO':
    nuevoEstado =
        'LISTO_PARA_DESPACHO';
    break;

  default:
    throw new BusinessRuleError(
      'Evento de despacho no válido',
      'EVENTO_DESPACHO_INVALIDO',
    );
  }

  await pedido.update({
    estado: nuevoEstado,
  });

  return await obtenerPorId(
    pedidoId,
  );
};

export const obtenerPedidosDisponibles = async () => {
  return await Pedido.findAll({
    where: {
      estado: 'LISTO_PARA_DESPACHO',
    },
    include: pedidoRelations,
    order: [['id', 'ASC']],
  });
};
