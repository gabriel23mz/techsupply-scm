import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Grupo 1 - Inbound
 * Gestión de Compras e Inventario
 */
const OrdenCompra = sequelize.define(
  'OrdenCompra',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    proveedor_id: {
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

    estado: {
      type: DataTypes.ENUM(
        'PENDIENTE',
        'APROBADA',
        'RECIBIDA',
        'CANCELADA',
      ),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },

    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
  },
  {
    tableName: 'ordenes_compra',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

export default OrdenCompra;
