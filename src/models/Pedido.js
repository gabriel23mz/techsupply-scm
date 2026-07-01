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

    estado: {
      type: DataTypes.ENUM(
        'PENDIENTE',
        'PREPARANDO',
        'LISTO_PARA_DESPACHO',
        'DESPACHADO',
        'ENTREGADO',
        'CANCELADO',
      ),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },

    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'pedidos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

export default Pedido;
