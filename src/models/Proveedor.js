import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Grupo 1 - Inbound
 * Gestión de Compras e Inventario
 */
const Proveedor = sequelize.define(
  'Proveedor',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    ruc: {
      type: DataTypes.STRING(13),
      allowNull: false,
      unique: true,
      validate: {
        len: {
          args: [13, 13],
          msg: 'El RUC debe tener 13 caracteres',
        },
      },
    },

    telefono: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    correo: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'El correo del proveedor no es válido',
        },
      },
    },

    direccion: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'proveedores',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

export default Proveedor;
