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
      validate: {
        min: {
          args: [0.01],
          msg: 'La distancia debe ser mayor a cero',
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
    tableName: 'rutas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',

    indexes: [
      {
        unique: true,
        fields: ['origen_id', 'destino_id'],
        name: 'rutas_origen_destino_unique',
      },
      {
        fields: ['estado'],
        name: 'rutas_estado_idx',
      },
    ],

    validate: {
      origenDestinoDiferentes() {
        if (
          Number(this.origen_id) ===
        Number(this.destino_id)
        ) {
          throw new Error(
            'El origen y el destino de una ruta deben ser diferentes',
          );
        }
      },
    },
  },
);

export default Ruta;
