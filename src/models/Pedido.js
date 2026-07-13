import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Pedido = sequelize.define(
  'Pedido',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    fecha_entrega: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    estado: {
      type: DataTypes.ENUM(
        'PENDIENTE',
        'PREPARANDO',
        'LISTO_PARA_DESPACHO',
        'DESPACHADO',
        'ENTREGADO',
        'CANCELADO',
        'REPROGRAMADO',
      ),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },

    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'El total del pedido no puede ser negativo',
        },
      },
    },
  },
  {
    tableName: 'pedidos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['estado'],
        name: 'pedidos_estado_idx',
      },
      {
        fields: ['fecha_entrega'],
        name: 'pedidos_fecha_entrega_idx',
      },
      {
        fields: ['cliente_id'],
        name: 'pedidos_cliente_idx',
      },
    ],
  },
);

export default Pedido;
