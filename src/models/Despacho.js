import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Despacho = sequelize.define(
  'Despacho',
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

    fecha_salida: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    fecha_entrega: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    estado: {
      type: DataTypes.ENUM(
        'PENDIENTE',
        'EN_TRANSITO',
        'ENTREGADO',
        'CANCELADO',
      ),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },

    ruta_json: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    distancia_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    tiempo_estimado: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'despachos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

export default Despacho;
