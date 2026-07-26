'use strict';

const { buildProducts } = require('../support/demoData.cjs');

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'productos',
      buildProducts().map((product) => ({
        ...product,
        created_at: now,
        updated_at: now,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('productos', {
      id: buildProducts().map((product) => product.id),
    });
  },
};
