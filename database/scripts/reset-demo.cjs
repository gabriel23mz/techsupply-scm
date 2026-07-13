'use strict';

const path = require('path');
const { Sequelize } = require('sequelize');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
});

if (!process.env.DATABASE_URL) {
  throw new Error(
    'La variable DATABASE_URL no está configurada',
  );
}

const sequelize = new Sequelize(
  process.env.DATABASE_URL,
  {
    dialect: 'postgres',
    logging: false,

    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
);

const ejecutar = async () => {
  try {
    await sequelize.authenticate();

    /*
     * CASCADE permite eliminar registros relacionados.
     * RESTART IDENTITY reinicia los IDs desde 1.
     *
     * No se eliminan las tablas ni las migraciones.
     */
    await sequelize.query(`
      TRUNCATE TABLE
        "detalle_ingreso",
        "ingresos_inventario",
        "detalle_orden_compra",
        "ordenes_compra",
        "despachos",
        "detalle_pedido",
        "jornadas_reparto",
        "pedidos",
        "rutas",
        "clientes",
        "productos",
        "camiones",
        "proveedores",
        "ubicaciones",
        "categorias",
        "usuarios"
      RESTART IDENTITY CASCADE;
    `);

    /*
     * Permite ejecutar nuevamente todos los seeders.
     */
    await sequelize.query(`
      TRUNCATE TABLE "SequelizeData";
    `);

    console.log(
      '✅ Datos eliminados y secuencias reiniciadas',
    );
  } catch (error) {
    console.error(
      '❌ Error al reiniciar los datos:',
      error,
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

ejecutar();

