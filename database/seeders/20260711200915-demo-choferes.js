'use strict';

const { dateOnlyOffset } = require('../support/demoData.cjs');

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const definitions = [
      [1, 11, 'LIC-M-0001', 'E', dateOnlyOffset(900), true],
      [2, 12, 'LIC-M-0002', 'E', dateOnlyOffset(780), true],
      [3, 13, 'LIC-M-0003', 'E', dateOnlyOffset(650), true],
      [4, 14, 'LIC-M-0004', 'E', dateOnlyOffset(520), true],
      [5, 15, 'LIC-M-0005', 'E', dateOnlyOffset(430), true],
      [6, 16, 'LIC-M-0006', 'E', dateOnlyOffset(360), true],
      [7, 17, 'LIC-M-0007', 'E', dateOnlyOffset(-30), true],
      [8, 18, 'LIC-M-0008', 'E', dateOnlyOffset(700), false],
    ];

    await queryInterface.bulkInsert(
      'choferes',
      definitions.map(([
        id,
        usuario_id,
        numero_licencia,
        categoria_licencia,
        fecha_vencimiento_licencia,
        activo,
      ]) => ({
        id,
        usuario_id,
        numero_licencia,
        categoria_licencia,
        fecha_vencimiento_licencia,
        activo,
        created_at: now,
        updated_at: now,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('choferes', {
      id: Array.from({ length: 8 }, (_, index) => index + 1),
    });
  },
};
