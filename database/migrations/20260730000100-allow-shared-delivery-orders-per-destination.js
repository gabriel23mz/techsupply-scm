'use strict';

/**
 * Varios despachos de una misma ubicación comparten orden_entrega.
 * La coherencia orden <-> destino se valida en la capa de servicio,
 * porque destino se obtiene mediante Pedido -> Cliente -> Ubicacion.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "despachos_jornada_orden_unique";
    `);
  },

  async down(queryInterface) {
    const [duplicados] = await queryInterface.sequelize.query(`
      SELECT "jornada_reparto_id", "orden_entrega"
      FROM "despachos"
      WHERE "jornada_reparto_id" IS NOT NULL
      GROUP BY "jornada_reparto_id", "orden_entrega"
      HAVING COUNT(*) > 1;
    `);

    if (duplicados.length) {
      throw new Error(
        'No se puede restaurar despachos_jornada_orden_unique: existen paradas compartidas.',
      );
    }

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX "despachos_jornada_orden_unique"
      ON "despachos" ("jornada_reparto_id", "orden_entrega")
      WHERE "jornada_reparto_id" IS NOT NULL;
    `);
  },
};
