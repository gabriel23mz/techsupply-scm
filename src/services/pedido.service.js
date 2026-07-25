import Pedido from '../models/Pedido.js';
import Cliente from '../models/Cliente.js';
import Usuario from '../models/Usuario.js';
import DetallePedido from '../models/DetallePedido.js';
import Producto from '../models/Producto.js';
import Despacho from '../models/Despacho.js';
import sequelize from '../config/database.js';

import {
  BusinessRuleError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors.js';

import {
  ROLES,
  isAdmin,
} from '../constants/permissions.js';

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

const getUserRole = (user) =>
  user?.rol ?? ROLES.ADMIN;

const assertPedidoVisible = (
  pedido,
  user,
) => {
  const role = getUserRole(user);

  if (
    role === ROLES.VENTAS &&
    Number(pedido.creado_por_usuario_id) !==
      Number(user.id)
  ) {
    throw new ForbiddenError(
      'No puede acceder a un pedido de otro vendedor',
      'PEDIDO_AJENO',
    );
  }

  if (
    role === ROLES.BODEGA &&
    pedido.estado !== 'PREPARANDO'
  ) {
    throw new ForbiddenError(
      'Bodega solo puede consultar pedidos en preparación',
      'PEDIDO_NO_VISIBLE_BODEGA',
    );
  }
};

const assertPedidoPropioVentas = (
  pedido,
  user,
) => {
  if (
    getUserRole(user) === ROLES.VENTAS &&
    Number(pedido.creado_por_usuario_id) !==
      Number(user.id)
  ) {
    throw new ForbiddenError(
      'No puede operar un pedido de otro vendedor',
      'PEDIDO_AJENO',
    );
  }
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

export const obtenerTodos = async (user) => {
  const role = getUserRole(user);
  const where = {};

  if (role === ROLES.VENTAS) {
    where.creado_por_usuario_id = user.id;
  }

  if (role === ROLES.BODEGA) {
    where.estado = 'PREPARANDO';
  }

  if (role === ROLES.LOGISTICA) {
    where.estado = [
      'LISTO_PARA_DESPACHO',
      'DESPACHADO',
      'ENTREGADO',
      'REPROGRAMADO',
    ];
  }

  return await Pedido.findAll({
    where,
    include: pedidoRelations,
    order: [['id', 'ASC']],
  });
};

export const obtenerPorId = async (
  id,
  user,
) => {
  const pedido = await Pedido.findByPk(id, {
    include: pedidoRelationsDetalle,
  });

  if (!pedido) {
    throw new NotFoundError(
      'Pedido no encontrado',
      'PEDIDO_NO_ENCONTRADO',
    );
  }

  assertPedidoVisible(pedido, user);

  return pedido;
};

export const crear = async (
  datos,
  user,
) => {
  await validarCliente(datos.cliente_id);

  const usuarioId = user?.id ?? datos.usuario_id;

  await validarUsuario(usuarioId);

  const pedido = await Pedido.create({
    cliente_id: datos.cliente_id,
    usuario_id: usuarioId,
    creado_por_usuario_id: usuarioId,
    fecha: datos.fecha || new Date(),
    fecha_entrega: null,
    estado: 'PENDIENTE',
    total: 0,
  });

  return await obtenerPorId(pedido.id, user);
};

export const actualizar = async (
  id,
  datos,
  user,
) => {
  const pedido = await obtenerPedidoBase(id);

  assertPedidoPropioVentas(pedido, user);

  if (pedido.estado !== 'PENDIENTE') {
    throw new BusinessRuleError(
      'Solo se pueden modificar pedidos pendientes',
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

  if (datos.usuario_id !== undefined) {
    await validarUsuario(datos.usuario_id);
  }

  await pedido.update(datos);

  return await obtenerPorId(id, user);
};

export const eliminar = async (id) => {
  await obtenerPedidoBase(id);

  throw new BusinessRuleError(
    'La eliminación de pedidos no está permitida. Utilice el endpoint de cancelación.',
    'PEDIDO_ELIMINACION_NO_PERMITIDA',
  );
};

export const preparar = async (
  id,
  user,
) => {
  const pedidoId = await sequelize.transaction(
    async (transaction) => {
      const pedido = await Pedido.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!pedido) {
        throw new NotFoundError(
          'Pedido no encontrado',
          'PEDIDO_NO_ENCONTRADO',
        );
      }

      assertPedidoPropioVentas(pedido, user);

      if (pedido.estado !== 'PENDIENTE') {
        throw new BusinessRuleError(
          'Solo los pedidos PENDIENTES pueden enviarse a preparación',
          'PEDIDO_ESTADO_INVALIDO_PREPARAR',
        );
      }

      const cantidadDetalles = await DetallePedido.count({
        where: {
          pedido_id: id,
        },
        transaction,
      });

      if (cantidadDetalles === 0) {
        throw new BusinessRuleError(
          'El pedido debe tener al menos un producto antes de enviarse a preparación',
          'PEDIDO_SIN_DETALLES',
        );
      }

      await pedido.update(
        {
          estado: 'PREPARANDO',
          enviado_preparacion_por_usuario_id:
            user?.id ?? null,
          enviado_preparacion_en: new Date(),
        },
        {
          transaction,
        },
      );

      return pedido.id;
    },
  );

  return await obtenerPorId(pedidoId, user);
};

export const finalizarPreparacion = async (
  id,
  user,
) => {
  const pedidoId = await sequelize.transaction(
    async (transaction) => {
      const pedido = await Pedido.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!pedido) {
        throw new NotFoundError(
          'Pedido no encontrado',
          'PEDIDO_NO_ENCONTRADO',
        );
      }

      if (pedido.estado !== 'PREPARANDO') {
        throw new BusinessRuleError(
          'Solo los pedidos en PREPARANDO pueden finalizar la preparación',
          'PEDIDO_ESTADO_INVALIDO_FINALIZAR_PREPARACION',
        );
      }

      const detalles = await DetallePedido.findAll({
        where: {
          pedido_id: id,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (detalles.length === 0) {
        throw new BusinessRuleError(
          'El pedido debe tener al menos un producto antes de quedar listo para despacho',
          'PEDIDO_SIN_DETALLES',
        );
      }

      const detalleIncompleto = detalles.find(
        (detalle) =>
          Number(detalle.cantidad_preparada) !==
          Number(detalle.cantidad),
      );

      if (detalleIncompleto) {
        throw new BusinessRuleError(
          'Todos los detalles deben estar completamente preparados',
          'PEDIDO_PREPARACION_INCOMPLETA',
        );
      }

      await pedido.update(
        {
          estado: 'LISTO_PARA_DESPACHO',
          preparacion_finalizada_por_usuario_id:
            user?.id ?? null,
          preparacion_finalizada_en: new Date(),
        },
        {
          transaction,
        },
      );

      return pedido.id;
    },
  );

  return await obtenerPorId(pedidoId, user);
};

export const cancelar = async (
  id,
  user,
) => {
  const pedidoId = await sequelize.transaction(
    async (transaction) => {
      const pedido = await Pedido.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!pedido) {
        throw new NotFoundError(
          'Pedido no encontrado',
          'PEDIDO_NO_ENCONTRADO',
        );
      }

      assertPedidoPropioVentas(pedido, user);

      const cancelableNormal =
        pedido.estado === 'PENDIENTE';

      const cancelableAdmin =
        isAdmin(user) &&
        ![
          'DESPACHADO',
          'ENTREGADO',
        ].includes(pedido.estado);

      if (
        !cancelableNormal &&
        !cancelableAdmin
      ) {
        throw new BusinessRuleError(
          'Solo se pueden cancelar pedidos pendientes',
          'PEDIDO_NO_CANCELABLE',
        );
      }

      const despachosActivos = await Despacho.count({
        where: {
          pedido_id: id,
          estado: [
            'PENDIENTE',
            'EN_TRANSITO',
          ],
        },
        transaction,
      });

      if (despachosActivos > 0) {
        throw new BusinessRuleError(
          'No se puede cancelar un pedido con despacho activo',
          'PEDIDO_CON_DESPACHO_ACTIVO',
        );
      }

      const detalles = await DetallePedido.findAll({
        where: {
          pedido_id: id,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      for (const detalle of detalles) {
        const producto = await Producto.findByPk(
          detalle.producto_id,
          {
            transaction,
            lock: transaction.LOCK.UPDATE,
          },
        );

        if (producto) {
          await producto.update(
            {
              stock_actual:
                producto.stock_actual +
                Number(detalle.cantidad),
            },
            {
              transaction,
            },
          );
        }
      }

      await pedido.update({
        estado: 'CANCELADO',
      }, {
        transaction,
      });

      return pedido.id;
    },
  );

  return await obtenerPorId(pedidoId, user);
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

export const obtenerPedidosDisponibles = async () => {
  return await Pedido.findAll({
    where: {
      estado: 'LISTO_PARA_DESPACHO',
      '$despachos.id$': null,
    },
    include: [
      ...pedidoRelations,
      {
        model: Despacho,
        as: 'despachos',
        required: false,
        where: {
          estado: [
            'PENDIENTE',
            'EN_TRANSITO',
          ],
        },
        attributes: ['id'],
      },
    ],
    order: [['id', 'ASC']],
  });
};
