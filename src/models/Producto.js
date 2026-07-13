import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Producto = sequelize.define(
  'Producto',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    
    categoria_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    precio_compra: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },

    precio_venta: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },


    stock_actual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: true,
        min: 0,
      },
    },

    stock_minimo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      validate: {
        isInt: true,
        min: 0,
      },
    },

    stock_maximo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: {
        isInt: true,
        min: 1,
      },
    },

    estado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'productos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',

    validate: {
      validarLimitesStock() {
        if (
          Number(this.stock_minimo) >
        Number(this.stock_maximo)
        ) {
          throw new Error(
            'El stock mínimo no puede superar al stock máximo',
          );
        }
      },

      validarPrecioVenta() {
        if (
          Number(this.precio_venta) <
        Number(this.precio_compra)
        ) {
          throw new Error(
            'El precio de venta no puede ser menor al precio de compra',
          );
        }
      },
    },
  },
);

export default Producto;
