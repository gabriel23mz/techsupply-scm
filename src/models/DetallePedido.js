import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DetallePedido = sequelize.define(
  'DetallePedido',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    pedido_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: {
          msg: 'La cantidad debe ser un número entero',
        },
        min: {
          args: [1],
          msg: 'La cantidad debe ser mayor a cero',
        },
      },
    },

    cantidad_preparada: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: {
          msg: 'La cantidad preparada debe ser un número entero',
        },
        min: {
          args: [0],
          msg: 'La cantidad preparada no puede ser negativa',
        },
      },
    },

    preparado_por_usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    fecha_preparacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    precio_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'El precio unitario no puede ser negativo',
        },
      },
    },

    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'El subtotal no puede ser negativo',
        },
      },
    },
  },
  {
    tableName: 'detalle_pedido',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['pedido_id', 'producto_id'],
        name: 'detalle_pedido_pedido_producto_unique',
      },
    ],
  },
);

export default DetallePedido;
