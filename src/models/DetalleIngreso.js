import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Grupo 1 - Inbound
 * Gestión de Compras e Inventario
 */
const DetalleIngreso = sequelize.define(
  'DetalleIngreso',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    //En el diseño original es: ingreso_id (FK)
    ingreso_inventario_id: {
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
  },
  {
    tableName: 'detalle_ingreso',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['ingreso_inventario_id', 'producto_id'],
        name: 'detalle_ingreso_ingreso_producto_unique',
      },
    ],
  },
);

export default DetalleIngreso;
