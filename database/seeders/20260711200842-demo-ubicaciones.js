'use strict';

const { locations } = require('../support/demoData.cjs');

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'ubicaciones',
      locations.map((location) => ({
        ...location,
        estado: true,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('ubicaciones', {
      id: locations.map((location) => location.id),
    });
  },
};
