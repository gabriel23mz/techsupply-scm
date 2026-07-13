import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Camion = sequelize.define('Camion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  codigo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },

  placa: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },

  descripcion: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },

  capacidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: {
        msg: 'La capacidad del camión debe ser un número entero',
      },
      min: {
        args: [1],
        msg: 'La capacidad del camión debe ser mayor a cero',
      },
    },
  },

  estado: {
    type: DataTypes.ENUM('EN_BODEGA', 'EN_RUTA', 'INACTIVO'),
    allowNull: false,
    defaultValue: 'EN_BODEGA',
  },
}, {
  tableName: 'camiones',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Camion;
