'use strict';

const path = require('path');
const { Sequelize } = require('sequelize');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
});

const databaseUrl = process.env.DATABASE_URL?.trim();
const useSsl =
  String(process.env.DB_SSL || 'false').toLowerCase() === 'true';

if (!databaseUrl) {
  throw new Error('DATABASE_URL no está configurada.');
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  ...(useSsl
    ? {
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
      }
    : {}),
});

const EXPECTED_MINIMUMS = {
  usuarios: 18,
  categorias: 12,
  ubicaciones: 30,
  proveedores: 10,
  camiones: 10,
  choferes: 8,
  productos: 72,
  clientes: 48,
  rutas: 100,
  pedidos: 72,
  detalle_pedido: 190,
  jornadas_reparto: 7,
  despachos: 30,
  ordenes_compra: 10,
  detalle_orden_compra: 28,
  ingresos_inventario: 4,
  detalle_ingreso: 10,
};

async function scalar(sql) {
  const [rows] = await sequelize.query(sql);
  return Number(Object.values(rows[0])[0]);
}

async function assertZero(sql, message) {
  const count = await scalar(sql);
  if (count !== 0) throw new Error(`${message} Registros: ${count}.`);
}

async function run() {
  try {
    await sequelize.authenticate();

    console.log('Conteos de datos demo:');
    for (const [table, minimum] of Object.entries(EXPECTED_MINIMUMS)) {
      const count = await scalar(`SELECT COUNT(*) FROM "${table}";`);
      const valid = count >= minimum;
      console.log(`${valid ? '✅' : '❌'} ${table}: ${count} (mínimo ${minimum})`);
      if (!valid) {
        throw new Error(`La tabla ${table} no alcanzó el mínimo esperado.`);
      }
    }

    const roles = await scalar(`
      SELECT COUNT(DISTINCT "rol")
      FROM "usuarios"
      WHERE "estado" = true;
    `);
    if (roles !== 6) {
      throw new Error('No existen usuarios activos para los seis roles del sistema.');
    }

    const warehouse = await scalar(`
      SELECT COUNT(*)
      FROM "ubicaciones"
      WHERE "id" = 1
        AND "nombre" = 'Bodega Central ESPAM MFL';
    `);
    if (warehouse !== 1) {
      throw new Error('La ubicación 1 no es la Bodega Central ESPAM MFL.');
    }

    await assertZero(`
      SELECT COUNT(*)
      FROM "choferes" AS "chofer"
      JOIN "usuarios" AS "usuario"
        ON "usuario"."id" = "chofer"."usuario_id"
      WHERE "usuario"."rol" <> 'CHOFER';
    `, 'Existen perfiles de chofer vinculados a usuarios con un rol incorrecto.');

    await assertZero(`
      SELECT COUNT(*)
      FROM "detalle_pedido"
      WHERE "cantidad_preparada" < 0
         OR "cantidad_preparada" > "cantidad";
    `, 'Existen cantidades preparadas inválidas.');

    await assertZero(`
      SELECT COUNT(DISTINCT "pedido"."id")
      FROM "pedidos" AS "pedido"
      JOIN "detalle_pedido" AS "detalle"
        ON "detalle"."pedido_id" = "pedido"."id"
      WHERE "pedido"."estado" IN (
        'LISTO_PARA_DESPACHO',
        'DESPACHADO',
        'ENTREGADO',
        'REPROGRAMADO'
      )
        AND "detalle"."cantidad_preparada" <> "detalle"."cantidad";
    `, 'Existen pedidos operativos con preparación incompleta.');

    await assertZero(`
      SELECT COUNT(*)
      FROM "pedidos"
      WHERE ("estado" = 'ENTREGADO' AND "fecha_entrega" IS NULL)
         OR ("estado" <> 'ENTREGADO' AND "fecha_entrega" IS NOT NULL);
    `, 'Las fechas reales de entrega no coinciden con los estados del pedido.');

    await assertZero(`
      SELECT COUNT(*)
      FROM "pedidos" AS "pedido"
      JOIN "despachos" AS "despacho"
        ON "despacho"."pedido_id" = "pedido"."id"
       AND "despacho"."estado" = 'ENTREGADO'
      WHERE "pedido"."estado" = 'ENTREGADO'
        AND "pedido"."fecha_entrega" IS DISTINCT FROM "despacho"."fecha_entrega";
    `, 'La entrega real del pedido no coincide con la del despacho entregado.');

    await assertZero(`
      SELECT COUNT(*)
      FROM (
        SELECT "pedido_id"
        FROM "despachos"
        WHERE "estado" IN ('PENDIENTE', 'EN_TRANSITO')
        GROUP BY "pedido_id"
        HAVING COUNT(*) > 1
      ) AS "duplicados";
    `, 'Existen pedidos con más de un despacho activo.');

    await assertZero(`
      SELECT COUNT(*)
      FROM (
        SELECT "camion_id", "fecha"
        FROM "jornadas_reparto"
        WHERE "estado" IN ('PLANIFICADA', 'EN_RUTA')
        GROUP BY "camion_id", "fecha"
        HAVING COUNT(*) > 1
      ) AS "duplicados";
    `, 'Existen camiones con jornadas activas duplicadas por fecha.');

    await assertZero(`
      SELECT COUNT(*)
      FROM (
        SELECT "chofer_id", "fecha"
        FROM "jornadas_reparto"
        WHERE "estado" IN ('PLANIFICADA', 'EN_RUTA')
          AND "chofer_id" IS NOT NULL
        GROUP BY "chofer_id", "fecha"
        HAVING COUNT(*) > 1
      ) AS "duplicados";
    `, 'Existen choferes con jornadas activas duplicadas por fecha.');

    await assertZero(`
      SELECT COUNT(*)
      FROM "jornadas_reparto" AS "jornada"
      JOIN "camiones" AS "camion"
        ON "camion"."id" = "jornada"."camion_id"
      WHERE ("jornada"."estado" = 'EN_RUTA' AND "camion"."estado" <> 'EN_RUTA')
         OR ("jornada"."estado" IN ('PLANIFICADA', 'FINALIZADA', 'CANCELADA')
             AND "camion"."estado" = 'EN_RUTA');
    `, 'Los estados físicos de camiones y jornadas son incoherentes.');

    await assertZero(`
      SELECT COUNT(*)
      FROM "jornadas_reparto" AS "jornada"
      WHERE "jornada"."carga_confirmada_en" IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM "despachos" AS "despacho"
          WHERE "despacho"."jornada_reparto_id" = "jornada"."id"
            AND "despacho"."cargado" = false
        );
    `, 'Existen jornadas con carga confirmada y despachos sin cargar.');

    await assertZero(`
      SELECT COUNT(*)
      FROM "despachos" AS "despacho"
      JOIN "jornadas_reparto" AS "jornada"
        ON "jornada"."id" = "despacho"."jornada_reparto_id"
      WHERE "jornada"."estado" IN ('EN_RUTA', 'FINALIZADA')
        AND "despacho"."cargado" = false;
    `, 'Existen jornadas iniciadas o finalizadas con carga incompleta.');

    await assertZero(`
      SELECT COUNT(*)
      FROM "despachos" AS "despacho"
      JOIN "jornadas_reparto" AS "jornada"
        ON "jornada"."id" = "despacho"."jornada_reparto_id"
      JOIN "pedidos" AS "pedido"
        ON "pedido"."id" = "despacho"."pedido_id"
      WHERE "jornada"."estado" = 'EN_RUTA'
        AND ("despacho"."estado" <> 'EN_TRANSITO'
             OR "pedido"."estado" <> 'DESPACHADO');
    `, 'La jornada en ruta no mantiene pedidos y despachos en estados coherentes.');

    await assertZero(`
      SELECT COUNT(*)
      FROM "ordenes_compra" AS "orden"
      WHERE "orden"."estado" = 'RECIBIDA'
        AND NOT EXISTS (
          SELECT 1
          FROM "ingresos_inventario" AS "ingreso"
          WHERE "ingreso"."orden_compra_id" = "orden"."id"
        );
    `, 'Existen órdenes recibidas sin ingreso de inventario.');

    const reachableLocations = await scalar(`
      WITH RECURSIVE alcanzables("id") AS (
        SELECT 1
        UNION
        SELECT "ruta"."destino_id"
        FROM "rutas" AS "ruta"
        JOIN alcanzables AS "actual"
          ON "actual"."id" = "ruta"."origen_id"
        WHERE "ruta"."estado" = true
      )
      SELECT COUNT(DISTINCT "id")
      FROM alcanzables;
    `);
    const activeLocations = await scalar(`
      SELECT COUNT(*)
      FROM "ubicaciones"
      WHERE "estado" = true;
    `);
    if (reachableLocations !== activeLocations) {
      throw new Error(
        `El grafo no conecta todas las ubicaciones activas desde la bodega: ${reachableLocations}/${activeLocations}.`,
      );
    }

    console.log('✅ Dataset demo coherente con las reglas operativas principales.');
  } catch (error) {
    console.error('❌ Verificación demo fallida:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
