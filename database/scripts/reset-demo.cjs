'use strict';

const path = require('path');
const { Sequelize } = require('sequelize');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
});

const databaseUrl = process.env.DATABASE_URL?.trim();
const allowReset =
  String(process.env.ALLOW_DEMO_RESET || '').toLowerCase() === 'true';
const useSsl =
  String(process.env.DB_SSL || 'false').toLowerCase() === 'true';

if (!databaseUrl) {
  throw new Error('DATABASE_URL no está configurada.');
}

if (!allowReset) {
  throw new Error(
    'Reset bloqueado. Define ALLOW_DEMO_RESET=true únicamente para una base demo local.',
  );
}

if (String(process.env.NODE_ENV || '').toLowerCase() === 'production') {
  throw new Error('Reset bloqueado en NODE_ENV=production.');
}

const parsedUrl = new URL(databaseUrl);
const host = parsedUrl.hostname.toLowerCase();
const databaseName = parsedUrl.pathname.replace(/^\//, '');
const localHosts = new Set(['127.0.0.1', 'localhost', '::1']);

if (!localHosts.has(host)) {
  throw new Error(
    `Reset bloqueado: el host ${host} no es local. Nunca ejecutes este script sobre Supabase.`,
  );
}

if (!databaseName.endsWith('_demo') && !databaseName.endsWith('_test')) {
  throw new Error(
    `Reset bloqueado: la base ${databaseName} debe terminar en _demo o _test.`,
  );
}

if (useSsl) {
  throw new Error('Reset bloqueado: DB_SSL debe ser false para la base demo local.');
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
});

const DATA_TABLES = [
  'detalle_ingreso',
  'ingresos_inventario',
  'detalle_orden_compra',
  'ordenes_compra',
  'despachos',
  'detalle_pedido',
  'jornadas_reparto',
  'pedidos',
  'rutas',
  'clientes',
  'productos',
  'choferes',
  'camiones',
  'proveedores',
  'ubicaciones',
  'categorias',
  'usuarios',
];

async function run() {
  try {
    await sequelize.authenticate();
    console.log(`Base demo confirmada: ${host}/${databaseName}`);

    await sequelize.transaction(async (transaction) => {
      await sequelize.query(
        `TRUNCATE TABLE ${DATA_TABLES.map((table) => `"${table}"`).join(', ')} RESTART IDENTITY CASCADE;`,
        { transaction },
      );

      await sequelize.query(
        `DO $$
        BEGIN
          IF to_regclass('public."SequelizeData"') IS NOT NULL THEN
            TRUNCATE TABLE "SequelizeData";
          END IF;
        END $$;`,
        { transaction },
      );
    });

    console.log('✅ Datos demo eliminados y secuencias reiniciadas.');
  } catch (error) {
    console.error('❌ No se pudo reiniciar la base demo:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
