'use strict';

const duplicateChecks = [
  {
    code: 'PEDIDO_YA_ASIGNADO',
    sql: `
      SELECT "pedido_id"
      FROM "despachos"
      WHERE "estado" IN ('PENDIENTE', 'EN_TRANSITO')
      GROUP BY "pedido_id"
      HAVING COUNT(*) > 1
    `,
    message:
      'No se puede crear despachos_pedido_activo_unique: existen pedidos con más de un despacho activo.',
  },
  {
    code: 'CAMION_NO_DISPONIBLE',
    sql: `
      SELECT "camion_id", "fecha"
      FROM "jornadas_reparto"
      WHERE "estado" IN ('PLANIFICADA', 'EN_RUTA')
        AND "camion_id" IS NOT NULL
      GROUP BY "camion_id", "fecha"
      HAVING COUNT(*) > 1
    `,
    message:
      'No se puede crear jornadas_reparto_camion_activo_unique: existen camiones con más de una jornada activa en la misma fecha.',
  },
  {
    code: 'CHOFER_NO_DISPONIBLE',
    sql: `
      SELECT "chofer_id", "fecha"
      FROM "jornadas_reparto"
      WHERE "estado" IN ('PLANIFICADA', 'EN_RUTA')
        AND "chofer_id" IS NOT NULL
      GROUP BY "chofer_id", "fecha"
      HAVING COUNT(*) > 1
    `,
    message:
      'No se puede crear jornadas_reparto_chofer_activo_unique: existen choferes con más de una jornada activa en la misma fecha.',
  },
  {
    code: 'CAMION_NO_DISPONIBLE',
    sql: `
      SELECT "camion_id"
      FROM "jornadas_reparto"
      WHERE "estado" = 'EN_RUTA'
        AND "camion_id" IS NOT NULL
      GROUP BY "camion_id"
      HAVING COUNT(*) > 1
    `,
    message:
      'No se puede crear jornadas_reparto_camion_en_ruta_unique: existen camiones con más de una jornada EN_RUTA.',
  },
  {
    code: 'CHOFER_NO_DISPONIBLE',
    sql: `
      SELECT "chofer_id"
      FROM "jornadas_reparto"
      WHERE "estado" = 'EN_RUTA'
        AND "chofer_id" IS NOT NULL
      GROUP BY "chofer_id"
      HAVING COUNT(*) > 1
    `,
    message:
      'No se puede crear jornadas_reparto_chofer_en_ruta_unique: existen choferes con más de una jornada EN_RUTA.',
  },
  {
    code: 'ORDEN_ENTREGA_DUPLICADO',
    sql: `
      SELECT "jornada_reparto_id", "orden_entrega"
      FROM "despachos"
      WHERE "jornada_reparto_id" IS NOT NULL
      GROUP BY "jornada_reparto_id", "orden_entrega"
      HAVING COUNT(*) > 1
    `,
    message:
      'No se puede crear despachos_jornada_orden_unique: existen órdenes de entrega duplicados en una jornada.',
  },
  {
    code: 'PEDIDO_YA_ASIGNADO',
    sql: `
      SELECT "jornada_reparto_id", "pedido_id"
      FROM "despachos"
      WHERE "jornada_reparto_id" IS NOT NULL
      GROUP BY "jornada_reparto_id", "pedido_id"
      HAVING COUNT(*) > 1
    `,
    message:
      'No se puede crear despachos_jornada_pedido_unique: existen pedidos duplicados dentro de una jornada.',
  },
];

async function assertNoDuplicates(
  queryInterface,
  {
    code,
    sql,
    message,
  },
) {
  const [rows] =
    await queryInterface.sequelize.query(sql);

  if (rows.length) {
    throw new Error(
      `${code}: ${message} Consulta de diagnóstico: ${sql.replace(/\s+/g, ' ').trim()}`,
    );
  }
}

module.exports = {
  async up(queryInterface) {
    for (const check of duplicateChecks) {
      await assertNoDuplicates(
        queryInterface,
        check,
      );
    }

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX "despachos_pedido_activo_unique"
      ON "despachos" ("pedido_id")
      WHERE "estado" IN ('PENDIENTE', 'EN_TRANSITO');
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX "jornadas_reparto_camion_activo_unique"
      ON "jornadas_reparto" ("camion_id", "fecha")
      WHERE "estado" IN ('PLANIFICADA', 'EN_RUTA')
        AND "camion_id" IS NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX "jornadas_reparto_chofer_activo_unique"
      ON "jornadas_reparto" ("chofer_id", "fecha")
      WHERE "estado" IN ('PLANIFICADA', 'EN_RUTA')
        AND "chofer_id" IS NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX "jornadas_reparto_camion_en_ruta_unique"
      ON "jornadas_reparto" ("camion_id")
      WHERE "estado" = 'EN_RUTA'
        AND "camion_id" IS NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX "jornadas_reparto_chofer_en_ruta_unique"
      ON "jornadas_reparto" ("chofer_id")
      WHERE "estado" = 'EN_RUTA'
        AND "chofer_id" IS NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX "despachos_jornada_orden_unique"
      ON "despachos" ("jornada_reparto_id", "orden_entrega")
      WHERE "jornada_reparto_id" IS NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX "despachos_jornada_pedido_unique"
      ON "despachos" ("jornada_reparto_id", "pedido_id")
      WHERE "jornada_reparto_id" IS NOT NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "despachos_jornada_pedido_unique";
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "despachos_jornada_orden_unique";
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "jornadas_reparto_chofer_activo_unique";
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "jornadas_reparto_camion_activo_unique";
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "jornadas_reparto_chofer_en_ruta_unique";
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "jornadas_reparto_camion_en_ruta_unique";
    `);

    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "despachos_pedido_activo_unique";
    `);
  },
};
