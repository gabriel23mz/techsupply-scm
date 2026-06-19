import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Ubicacion = sequelize.define(
  'Ubicacion',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },

    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'ubicaciones',
    timestamps: false,
  },
);

export default Ubicacion;
