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

    jornada_reparto_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    orden_entrega: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: {
          msg: 'El orden de entrega debe ser un número entero',
        },
        min: {
          args: [1],
          msg: 'El orden de entrega debe ser mayor a cero',
        },
      },
    },

    fecha_estimada_entrega: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    estado: {
      type: DataTypes.ENUM(
        'PENDIENTE',
        'EN_TRANSITO',
        'ENTREGADO',
        'NO_ENTREGADO',
        'CANCELADO',
      ),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },

    ruta_json: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    distancia_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'La distancia total no puede ser negativa',
        },
      },
    },

    tiempo_estimado: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isInt: {
          msg: 'El tiempo estimado debe ser un número entero',
        },
        min: {
          args: [0],
          msg: 'El tiempo estimado no puede ser negativo',
        },
      },
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
