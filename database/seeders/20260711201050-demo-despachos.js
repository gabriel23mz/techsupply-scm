'use strict';

const { buildDispatchDefinitions } = require('../support/demoData.cjs');

module.exports = {
  async up(queryInterface) {
    const rows = buildDispatchDefinitions().map((dispatch) => ({
      ...dispatch,
      ruta_json: dispatch.ruta_json
        ? JSON.stringify(dispatch.ruta_json)
        : null,
    }));

    await queryInterface.bulkInsert(
      'despachos',
      rows,
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('despachos', {
      id: buildDispatchDefinitions().map((dispatch) => dispatch.id),
    });
  },
};
