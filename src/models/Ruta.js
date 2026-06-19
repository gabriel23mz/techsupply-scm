import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Ruta = sequelize.define(
  'Ruta',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    origen_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    destino_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    distancia_km: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'rutas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

export default Ruta;
