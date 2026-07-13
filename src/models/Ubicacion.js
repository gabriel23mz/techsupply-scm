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

    latitud: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      validate: {
        min: {
          args: [-90],
          msg: 'La latitud no puede ser menor a -90',
        },
        max: {
          args: [90],
          msg: 'La latitud no puede ser mayor a 90',
        },
      },
    },

    longitud: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      validate: {
        min: {
          args: [-180],
          msg: 'La longitud no puede ser menor a -180',
        },
        max: {
          args: [180],
          msg: 'La longitud no puede ser mayor a 180',
        },
      },
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

    validate: {
      coordenadasCompletas() {
        const tieneLatitud =
        this.latitud !== null &&
        this.latitud !== undefined;

        const tieneLongitud =
        this.longitud !== null &&
        this.longitud !== undefined;

        if (tieneLatitud !== tieneLongitud) {
          throw new Error(
            'La ubicación debe registrar latitud y longitud juntas',
          );
        }
      },
    },
  },
);

export default Ubicacion;
