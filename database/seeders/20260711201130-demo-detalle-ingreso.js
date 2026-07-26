'use strict';

module.exports = {
  async up(queryInterface) {
    const orderToIncome = new Map([
      [3, 1],
      [4, 2],
      [7, 3],
      [10, 4],
    ]);

    const [details] = await queryInterface.sequelize.query(`
      SELECT
        "orden_compra_id",
        "producto_id",
        "cantidad"
      FROM "detalle_orden_compra"
      WHERE "orden_compra_id" IN (3, 4, 7, 10)
      ORDER BY "orden_compra_id", "id";
    `);

    await queryInterface.bulkInsert(
      'detalle_ingreso',
      details.map((detail, index) => ({
        id: index + 1,
        ingreso_inventario_id: orderToIncome.get(Number(detail.orden_compra_id)),
        producto_id: Number(detail.producto_id),
        cantidad: Number(detail.cantidad),
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('detalle_ingreso', {
      ingreso_inventario_id: [1, 2, 3, 4],
    });
  },
};
