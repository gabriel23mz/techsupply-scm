'use strict';

const { categories } = require('../support/demoData.cjs');

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'categorias',
      categories.map(([nombre, descripcion], index) => ({
        id: index + 1,
        nombre,
        descripcion,
        estado: true,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('categorias', {
      id: Array.from({ length: categories.length }, (_, index) => index + 1),
    });
  },
};
