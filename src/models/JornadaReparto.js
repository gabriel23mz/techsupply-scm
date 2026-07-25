import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const JornadaReparto = sequelize.define('JornadaReparto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  camion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  chofer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  carga_confirmada_por_usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

  carga_confirmada_en: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },

  inicio_estimado_en: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  retorno_estimado_en: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  fecha_salida: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  fecha_finalizacion: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  estado: {
    type: DataTypes.ENUM('PLANIFICADA', 'EN_RUTA', 'FINALIZADA', 'CANCELADA'),
    allowNull: false,
    defaultValue: 'PLANIFICADA',
  },

  posicion_actual_orden: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      isInt: true,
      min: 0,
    },
  },

  ruta_json: {
    type: DataTypes.JSONB,
    allowNull: true,
  },

  distancia_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
    },
  },

  tiempo_estimado: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      isInt: true,
      min: 0,
    },
  },
},
{
  tableName: 'jornadas_reparto',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['camion_id'],
      name: 'jornadas_reparto_camion_idx',
    },
    {
      fields: ['estado'],
      name: 'jornadas_reparto_estado_idx',
    },
    {
      fields: ['fecha'],
      name: 'jornadas_reparto_fecha_idx',
    },
    {
      fields: ['chofer_id', 'estado'],
      name: 'jornadas_reparto_chofer_estado_idx',
    },
  ],
});

export default JornadaReparto;

