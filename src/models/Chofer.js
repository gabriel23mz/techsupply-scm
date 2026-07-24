import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Chofer = sequelize.define(
  'Chofer',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },

    numero_licencia: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    categoria_licencia: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },

    fecha_vencimiento_licencia: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'choferes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

export default Chofer;
