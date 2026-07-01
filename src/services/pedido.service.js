import Pedido from '../models/Pedido.js';
import Cliente from '../models/Cliente.js';
import Usuario from '../models/Usuario.js';
import DetallePedido from '../models/DetallePedido.js';
import Producto from '../models/Producto.js';


const pedidoRelations = [
  {
    model: Cliente,
    attributes: [
      'id',
      'nombre',
      'ubicacion_id',
    ],
  },
  {
    model: Usuario,
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
    include: [
      {
        model: Producto,
        attributes: [
          'id',
          'nombre',
          'precio_venta',
        ],
      },
    ],
  },
];


export const obtenerTodos = async () => {
  return await Pedido.findAll({
    include: pedidoRelations,
    order: [['id', 'ASC']],
  });
};


export const obtenerPorId = async (id) => {
  return await Pedido.findByPk(id, {
    include: pedidoRelationsDetalle,
  });
};


export const crear = async (datos) => {
  return await Pedido.create(datos);
};


export const actualizar = async (id, datos) => {
  const pedido = await Pedido.findByPk(id);

  if (!pedido) {
    return null;
  }

  if (
    pedido.estado !== 'PENDIENTE' &&
    pedido.estado !== 'PREPARANDO'
  ) {
    throw new Error(
      'Solo se pueden modificar pedidos pendientes o en preparación',
    );
  }

  await pedido.update(datos);

  return await obtenerPorId(id);
};


export const eliminar = async (id) => {
  const pedido = await Pedido.findByPk(id);

  if (!pedido) {
    return null;
  }

  throw new Error(
    'La eliminación de pedidos no está permitida. Utilice el endpoint de cancelación.',
  );
};


export const preparar = async (id) => {
  const pedido = await Pedido.findByPk(id);

  if (!pedido) {
    return null;
  }

  if (pedido.estado !== 'PENDIENTE') {
    throw new Error(
      'Solo los pedidos PENDIENTES pueden prepararse',
    );
  }

  await pedido.update({
    estado: 'PREPARANDO',
  });

  return await obtenerPorId(id);
};


export const finalizarPreparacion = async (id) => {
  const pedido = await Pedido.findByPk(id);

  if (!pedido) {
    return null;
  }

  if (pedido.estado !== 'PREPARANDO') {
    throw new Error(
      'Solo los pedidos en PREPARANDO pueden finalizar la preparación',
    );
  }

  const detalles =
    await DetallePedido.findAll({
      where: {
        pedido_id: id,
      },
    });

  if (detalles.length === 0) {
    throw new Error(
      'El pedido debe tener al menos un producto antes de quedar listo para despacho',
    );
  }

  await pedido.update({
    estado: 'LISTO_PARA_DESPACHO',
  });

  return await obtenerPorId(id);
};


export const cancelar = async (id) => {
  const pedido = await Pedido.findByPk(id);

  if (!pedido) {
    return null;
  }

  if (
    pedido.estado !== 'PENDIENTE' &&
    pedido.estado !== 'PREPARANDO' &&
    pedido.estado !== 'LISTO_PARA_DESPACHO'
  ) {
    throw new Error(
      'Solo se pueden cancelar pedidos pendientes, en preparación o listos para despacho',
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
    return null;
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
    throw new Error(
      'Evento de despacho no válido',
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
