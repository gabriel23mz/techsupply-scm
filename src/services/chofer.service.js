import { Op } from 'sequelize';

import sequelize from '../config/database.js';
import db from '../models/index.js';

import {
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../utils/errors.js';

import {
  ROLES,
  isAdmin,
} from '../constants/permissions.js';

const {
  Chofer,
  Usuario,
  JornadaReparto,
  Camion,
  Despacho,
  Pedido,
  Cliente,
  Ubicacion,
} = db;

const ESTADOS_JORNADA_ACTIVA = [
  'PLANIFICADA',
  'EN_RUTA',
];

const includeUsuario = {
  model: Usuario,
  as: 'usuario',
  attributes: [
    'id',
    'nombre',
    'apellido',
    'correo',
    'rol',
    'estado',
  ],
};

const includeJornadas = {
  model: JornadaReparto,
  as: 'jornadas',
  required: false,
  where: {
    estado: {
      [Op.in]: ESTADOS_JORNADA_ACTIVA,
    },
  },
};

const jornadaCompletaInclude = [
  {
    model: Camion,
    as: 'camion',
  },
  {
    model: Chofer,
    as: 'chofer',
    include: [includeUsuario],
  },
  {
    model: Despacho,
    as: 'despachos',
    include: [
      {
        model: Pedido,
        as: 'pedido',
        include: [
          {
            model: Cliente,
            as: 'cliente',
            include: [
              {
                model: Ubicacion,
                as: 'ubicacion',
              },
            ],
          },
        ],
      },
    ],
  },
];

const licenciaVencida = (fecha) => {
  const vencimiento = new Date(`${fecha}T23:59:59`);

  return Number.isNaN(vencimiento.getTime()) ||
    vencimiento < new Date();
};

const validarUsuarioChofer = async (
  usuarioId,
  options = {},
) => {
  const usuario = await Usuario.findOne({
    where: {
      id: usuarioId,
      estado: true,
    },
    transaction: options.transaction,
    lock: options.lock,
  });

  if (!usuario) {
    throw new NotFoundError(
      'Usuario no encontrado',
      'USUARIO_NO_ENCONTRADO',
    );
  }

  if (usuario.rol !== ROLES.CHOFER) {
    throw new BusinessRuleError(
      'El usuario asociado debe tener rol CHOFER',
      'USUARIO_NO_CHOFER',
    );
  }

  return usuario;
};

const validarLicenciaVigente = (chofer) => {
  if (
    licenciaVencida(
      chofer.fecha_vencimiento_licencia,
    )
  ) {
    throw new BusinessRuleError(
      'La licencia del chofer está vencida',
      'LICENCIA_VENCIDA',
    );
  }
};

export const obtenerTodos = async (user) => {
  if (user?.rol === ROLES.CHOFER) {
    return [
      await obtenerPerfilPropio(user),
    ];
  }

  return Chofer.findAll({
    include: [
      includeUsuario,
      includeJornadas,
    ],
    order: [['id', 'ASC']],
  });
};

export const obtenerDisponibles = async () => {
  const choferes = await Chofer.findAll({
    where: {
      activo: true,
    },
    include: [
      includeUsuario,
      includeJornadas,
    ],
    order: [['id', 'ASC']],
  });

  return choferes.filter((chofer) => {
    const plain = chofer.toJSON
      ? chofer.toJSON()
      : chofer;

    return (
      plain.usuario?.rol === ROLES.CHOFER &&
      plain.usuario?.estado !== false &&
      !licenciaVencida(
        plain.fecha_vencimiento_licencia,
      ) &&
      !plain.jornadas?.length
    );
  });
};

export const obtenerPorId = async (
  id,
  user,
) => {
  const chofer = await Chofer.findByPk(id, {
    include: [
      includeUsuario,
      includeJornadas,
    ],
  });

  if (!chofer) {
    throw new NotFoundError(
      'Chofer no encontrado',
      'CHOFER_NO_ENCONTRADO',
    );
  }

  if (
    user?.rol === ROLES.CHOFER &&
    Number(chofer.usuario_id) !== Number(user.id)
  ) {
    throw new ForbiddenError(
      'No puede acceder al perfil de otro chofer',
      'CHOFER_AJENO',
    );
  }

  return chofer;
};

export const obtenerPerfilPropio = async (user) => {
  const chofer = await Chofer.findOne({
    where: {
      usuario_id: user.id,
    },
    include: [
      includeUsuario,
      includeJornadas,
    ],
  });

  if (!chofer) {
    throw new NotFoundError(
      'Perfil de chofer no encontrado',
      'CHOFER_NO_ENCONTRADO',
    );
  }

  return chofer;
};

export const crear = async (datos) => {
  const choferId = await sequelize.transaction(
    async (transaction) => {
      await validarUsuarioChofer(
        datos.usuario_id,
        {
          transaction,
          lock: transaction.LOCK.UPDATE,
        },
      );

      if (
        licenciaVencida(
          datos.fecha_vencimiento_licencia,
        )
      ) {
        throw new BusinessRuleError(
          'No se puede registrar un chofer con licencia vencida',
          'LICENCIA_VENCIDA',
        );
      }

      const existente = await Chofer.findOne({
        where: {
          [Op.or]: [
            {
              usuario_id: datos.usuario_id,
            },
            {
              numero_licencia:
                datos.numero_licencia,
            },
          ],
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (existente) {
        throw new ConflictError(
          'El usuario o licencia ya está asociado a un chofer',
          'CHOFER_DUPLICADO',
        );
      }

      const chofer = await Chofer.create(
        {
          usuario_id: datos.usuario_id,
          numero_licencia:
            String(datos.numero_licencia).trim(),
          categoria_licencia:
            String(datos.categoria_licencia).trim(),
          fecha_vencimiento_licencia:
            datos.fecha_vencimiento_licencia,
          activo: datos.activo ?? true,
        },
        {
          transaction,
        },
      );

      return chofer.id;
    },
  );

  return obtenerPorId(choferId);
};

export const actualizar = async (
  id,
  datos,
) => {
  const choferId = await sequelize.transaction(
    async (transaction) => {
      const chofer = await Chofer.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!chofer) {
        throw new NotFoundError(
          'Chofer no encontrado',
          'CHOFER_NO_ENCONTRADO',
        );
      }

      if (
        datos.usuario_id !== undefined &&
        Number(datos.usuario_id) !==
          Number(chofer.usuario_id)
      ) {
        await validarUsuarioChofer(
          datos.usuario_id,
          {
            transaction,
            lock: transaction.LOCK.UPDATE,
          },
        );
      }

      if (
        datos.fecha_vencimiento_licencia !==
          undefined &&
        licenciaVencida(
          datos.fecha_vencimiento_licencia,
        )
      ) {
        throw new BusinessRuleError(
          'No se puede guardar una licencia vencida',
          'LICENCIA_VENCIDA',
        );
      }

      if (
        datos.numero_licencia !== undefined
      ) {
        const duplicado = await Chofer.findOne({
          where: {
            id: {
              [Op.ne]: id,
            },
            numero_licencia:
              datos.numero_licencia,
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (duplicado) {
          throw new ConflictError(
            'La licencia ya está registrada',
            'LICENCIA_DUPLICADA',
          );
        }
      }

      await chofer.update(datos, {
        transaction,
      });

      return chofer.id;
    },
  );

  return obtenerPorId(choferId);
};

export const eliminar = async (
  id,
  user,
) => {
  const choferId = await sequelize.transaction(
    async (transaction) => {
      const chofer = await Chofer.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!chofer) {
        throw new NotFoundError(
          'Chofer no encontrado',
          'CHOFER_NO_ENCONTRADO',
        );
      }

      if (!isAdmin(user)) {
        throw new ForbiddenError(
          'Solo ADMIN puede desactivar choferes',
          'CHOFER_DESACTIVACION_DENEGADA',
        );
      }

      const jornadasActivas =
        await JornadaReparto.count({
          where: {
            chofer_id: id,
            estado: {
              [Op.in]:
                ESTADOS_JORNADA_ACTIVA,
            },
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

      if (jornadasActivas > 0) {
        throw new BusinessRuleError(
          'No se puede desactivar un chofer con jornada activa',
          'CHOFER_CON_JORNADA_ACTIVA',
        );
      }

      await chofer.update(
        {
          activo: false,
        },
        {
          transaction,
        },
      );

      return chofer.id;
    },
  );

  return obtenerPorId(choferId);
};

export const validarAsignable = async (
  choferId,
  options = {},
) => {
  const chofer = await Chofer.findByPk(
    choferId,
    {
      include: [includeUsuario],
      transaction: options.transaction,
      lock: options.lock,
    },
  );

  if (!chofer) {
    throw new NotFoundError(
      'Chofer no encontrado',
      'CHOFER_NO_ENCONTRADO',
    );
  }

  if (!chofer.activo) {
    throw new BusinessRuleError(
      'No se puede asignar un chofer inactivo',
      'CHOFER_INACTIVO',
    );
  }

  if (chofer.usuario?.rol !== ROLES.CHOFER) {
    throw new BusinessRuleError(
      'El usuario asociado ya no tiene rol CHOFER',
      'USUARIO_NO_CHOFER',
    );
  }

  if (chofer.usuario?.estado === false) {
    throw new BusinessRuleError(
      'El usuario del chofer está inactivo',
      'USUARIO_CHOFER_INACTIVO',
    );
  }

  validarLicenciaVigente(chofer);

  return chofer;
};

export const obtenerJornadasPropias = async (
  user,
) => {
  const chofer = await obtenerPerfilPropio(user);

  return JornadaReparto.findAll({
    where: {
      chofer_id: chofer.id,
    },
    include: jornadaCompletaInclude,
    order: [['id', 'DESC']],
  });
};
