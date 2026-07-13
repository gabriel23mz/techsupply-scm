import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Grupo 1 - Inbound
 * Gestión de Compras e Inventario
 */
const IngresoInventario = sequelize.define(
  'IngresoInventario',
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

    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    fecha_ingreso: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    observacion: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    tableName: 'ingresos_inventario',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

export default IngresoInventario;
