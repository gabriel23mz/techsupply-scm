import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Grupo 1 - Inbound
 * Gestión de Compras e Inventario
 */
const DetalleOrdenCompra = sequelize.define(
  'DetalleOrdenCompra',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    orden_compra_id: {
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
        isInt: true,
        min: 1,
      },
    },

    precio_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },

    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
  },
  {
    tableName: 'detalle_orden_compra',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['orden_compra_id', 'producto_id'],
        name: 'detalle_orden_compra_orden_producto_unique',
      },
    ],
  },
);

export default DetalleOrdenCompra;
