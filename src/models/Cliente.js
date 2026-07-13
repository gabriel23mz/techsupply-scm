import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Cliente = sequelize.define(
  'Cliente',
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

    identificacion: {
      type: DataTypes.STRING(13),
      allowNull: false,
      unique: true,
      validate: {
        len: {
          args: [10, 13],
          msg: 'La identificación debe tener entre 10 y 13 caracteres',
        },
      },
    },

    telefono: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        len: {
          args: [10, 10],
          msg: 'El teléfono debe tener 10 caracteres',
        },
      },
    },

    correo: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'El correo del cliente no es válido',
        },
      },
    },

    direccion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    
    ubicacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'clientes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

export default Cliente;
