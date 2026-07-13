'use strict';

module.exports = {
  async up(queryInterface) {
    const detalles = [];

    let idDetalle = 1;

    for (let pedidoId = 1; pedidoId <= 14; pedidoId += 1) {
      const productoPrincipal =
        ((pedidoId - 1) % 10) + 1;

      let productoSecundario =
        (pedidoId % 10) + 1;

      if (
        productoPrincipal ===
        productoSecundario
      ) {
        productoSecundario =
          (productoSecundario % 10) + 1;
      }

      const precios = {
        1: 650.00,
        2: 560.00,
        3: 48.00,
        4: 82.00,
        5: 30.00,
        6: 22.00,
        7: 165.00,
        8: 65.00,
        9: 195.00,
        10: 110.00,
      };

      detalles.push({
        id: idDetalle++,
        pedido_id: pedidoId,
        producto_id: productoPrincipal,
        cantidad: 1,
        precio_unitario:
          precios[productoPrincipal],
        subtotal:
          precios[productoPrincipal],
      });

      detalles.push({
        id: idDetalle++,
        pedido_id: pedidoId,
        producto_id: productoSecundario,
        cantidad: 2,
        precio_unitario:
          precios[productoSecundario],
        subtotal:
          precios[productoSecundario] * 2,
      });
    }

    await queryInterface.bulkInsert(
      'detalle_pedido',
      detalles,
    );

    /*
     * Actualiza el total de cada pedido con la suma
     * de sus detalles.
     */
    await queryInterface.sequelize.query(`
      UPDATE "pedidos" AS p
      SET "total" = (
        SELECT COALESCE(
          SUM(dp."subtotal"),
          0
        )
        FROM "detalle_pedido" AS dp
        WHERE dp."pedido_id" = p."id"
      )
      WHERE p."id" BETWEEN 1 AND 14;
    `);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      'detalle_pedido',
      {
        pedido_id: [
          1, 2, 3, 4, 5, 6, 7,
          8, 9, 10, 11, 12, 13, 14,
        ],
      },
    );

    await queryInterface.sequelize.query(`
      UPDATE "pedidos"
      SET "total" = 0
      WHERE "id" BETWEEN 1 AND 14;
    `);
  },
};

