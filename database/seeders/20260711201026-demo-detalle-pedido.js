'use strict';

const {
  buildProducts,
  atTimezoneOffset,
  orderStateForId,
} = require('../support/demoData.cjs');

module.exports = {
  async up(queryInterface) {
    const products = buildProducts();
    const priceById = new Map(
      products.map((product) => [product.id, Number(product.precio_venta)]),
    );
    const rows = [];
    let detailId = 1;

    for (let orderId = 1; orderId <= 72; orderId += 1) {
      const estado = orderStateForId(orderId);
      const productIds = [
        ((orderId * 3 - 1) % 71) + 1,
        ((orderId * 7 + 4) % 71) + 1,
        ((orderId * 11 + 9) % 71) + 1,
      ];
      const uniqueProductIds = [...new Set(productIds)];

      uniqueProductIds.forEach((productId, index) => {
        const cantidad = 1 + ((orderId + index) % 4);
        let cantidadPreparada = 0;

        if (estado === 'PREPARANDO') {
          if (orderId <= 18) {
            cantidadPreparada = index === 0
              ? cantidad
              : Math.max(0, cantidad - 1);
          } else {
            cantidadPreparada = cantidad;
          }
        } else if ([
          'LISTO_PARA_DESPACHO',
          'DESPACHADO',
          'ENTREGADO',
          'REPROGRAMADO',
        ].includes(estado)) {
          cantidadPreparada = cantidad;
        }

        const unitPrice = priceById.get(productId);
        const completed = cantidadPreparada === cantidad && cantidad > 0;

        rows.push({
          id: detailId,
          pedido_id: orderId,
          producto_id: productId,
          cantidad,
          cantidad_preparada: cantidadPreparada,
          preparado_por_usuario_id: completed ? (orderId % 2 === 0 ? 5 : 6) : null,
          fecha_preparacion: completed
            ? atTimezoneOffset(-1, 15, (detailId % 6) * 5)
            : null,
          precio_unitario: unitPrice,
          subtotal: Math.round(unitPrice * cantidad * 100) / 100,
        });

        detailId += 1;
      });
    }

    await queryInterface.bulkInsert('detalle_pedido', rows);

    await queryInterface.sequelize.query(`
      UPDATE "pedidos" AS "pedido"
      SET "total" = (
        SELECT COALESCE(SUM("detalle"."subtotal"), 0)
        FROM "detalle_pedido" AS "detalle"
        WHERE "detalle"."pedido_id" = "pedido"."id"
      )
      WHERE "pedido"."id" BETWEEN 1 AND 72;
    `);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('detalle_pedido', {
      pedido_id: Array.from({ length: 72 }, (_, index) => index + 1),
    });

    await queryInterface.sequelize.query(`
      UPDATE "pedidos"
      SET "total" = 0
      WHERE "id" BETWEEN 1 AND 72;
    `);
  },
};
