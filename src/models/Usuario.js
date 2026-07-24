import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Usuario = sequelize.define(
  'Usuario',
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

    apellido: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    correo: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'El correo del usuario no es válido',
        },
      },
    },

    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    rol: {
      type: DataTypes.ENUM(
        'ADMIN',
        'COMPRAS',
        'BODEGA',
        'VENTAS',
        'LOGISTICA',
        'CHOFER',
      ),
      allowNull: false,
    },

    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'usuarios',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

export default Usuario;
