'use strict';

const { atTimezoneOffset } = require('../support/demoData.cjs');

module.exports = {
  async up(queryInterface) {
    const states = [
      'PENDIENTE',
      'APROBADA',
      'RECIBIDA',
      'RECIBIDA',
      'CANCELADA',
      'APROBADA',
      'RECIBIDA',
      'PENDIENTE',
      'APROBADA',
      'RECIBIDA',
    ];

    const rows = states.map((estado, index) => {
      const id = index + 1;
      const date = atTimezoneOffset(-(16 - id), 9, 0);
      return {
        id,
        proveedor_id: ((id - 1) % 9) + 1,
        usuario_id: id % 2 === 0 ? 9 : 10,
        fecha: date,
        estado,
        total: 0,
        created_at: date,
        updated_at: date,
      };
    });

    await queryInterface.bulkInsert('ordenes_compra', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('ordenes_compra', {
      id: Array.from({ length: 10 }, (_, index) => index + 1),
    });
  },
};
