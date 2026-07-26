'use strict';

const { buildClients } = require('../support/demoData.cjs');

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'clientes',
      buildClients().map((client) => ({
        ...client,
        created_at: now,
        updated_at: now,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('clientes', {
      id: buildClients().map((client) => client.id),
    });
  },
};
