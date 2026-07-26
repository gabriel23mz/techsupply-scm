'use strict';

const { atTimezoneOffset } = require('../support/demoData.cjs');

module.exports = {
  async up(queryInterface) {
    const definitions = [
      [1, 3, 9, -11, 'Ingreso completo de la orden de compra 3.'],
      [2, 4, 10, -9, 'Ingreso completo de la orden de compra 4.'],
      [3, 7, 9, -5, 'Ingreso completo de la orden de compra 7.'],
      [4, 10, 10, -2, 'Ingreso completo de la orden de compra 10.'],
    ];

    await queryInterface.bulkInsert(
      'ingresos_inventario',
      definitions.map(([id, orderId, userId, offset, observacion]) => {
        const date = atTimezoneOffset(offset, 15, 30);
        return {
          id,
          orden_compra_id: orderId,
          usuario_id: userId,
          fecha_ingreso: date,
          observacion,
          created_at: date,
          updated_at: date,
        };
      }),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('ingresos_inventario', {
      id: [1, 2, 3, 4],
    });
  },
};
