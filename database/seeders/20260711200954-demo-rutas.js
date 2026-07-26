'use strict';

const { buildRoutes } = require('../support/demoData.cjs');

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'rutas',
      buildRoutes(4).map((route) => ({
        ...route,
        estado: true,
        created_at: now,
        updated_at: now,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('rutas', {
      id: buildRoutes(4).map((route) => route.id),
    });
  },
};
