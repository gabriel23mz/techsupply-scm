'use strict';

const { buildProducts } = require('../support/demoData.cjs');

module.exports = {
  async up(queryInterface) {
    const products = buildProducts();
    const purchasePrice = new Map(
      products.map((product) => [product.id, Number(product.precio_compra)]),
    );
    const rows = [];
    let id = 1;

    for (let orderId = 1; orderId <= 10; orderId += 1) {
      const productIds = [
        ((orderId * 5 - 1) % 71) + 1,
        ((orderId * 9 + 7) % 71) + 1,
        ((orderId * 13 + 3) % 71) + 1,
      ];

      for (const productId of [...new Set(productIds)]) {
        const cantidad = 8 + ((orderId + productId) % 15);
        const price = purchasePrice.get(productId);
        rows.push({
          id: id++,
          orden_compra_id: orderId,
          producto_id: productId,
          cantidad,
          precio_unitario: price,
          subtotal: Math.round(price * cantidad * 100) / 100,
        });
      }
    }

    await queryInterface.bulkInsert('detalle_orden_compra', rows);

    await queryInterface.sequelize.query(`
      UPDATE "ordenes_compra" AS "orden"
      SET "total" = (
        SELECT COALESCE(SUM("detalle"."subtotal"), 0)
        FROM "detalle_orden_compra" AS "detalle"
        WHERE "detalle"."orden_compra_id" = "orden"."id"
      )
      WHERE "orden"."id" BETWEEN 1 AND 10;
    `);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('detalle_orden_compra', {
      orden_compra_id: Array.from({ length: 10 }, (_, index) => index + 1),
    });

    await queryInterface.sequelize.query(`
      UPDATE "ordenes_compra"
      SET "total" = 0
      WHERE "id" BETWEEN 1 AND 10;
    `);
  },
};
