'use strict';

module.exports = {
  async up(queryInterface) {
    const fechaActual = new Date();
    const fechaEntrega = new Date();

    fechaEntrega.setDate(
      fechaEntrega.getDate() + 1,
    );

    const pedidos = [];

    for (let id = 1; id <= 14; id += 1) {
      pedidos.push({
        id,
        cliente_id: id,
        usuario_id: 2,
        fecha: fechaActual,
        fecha_entrega: fechaEntrega,
        estado: 'LISTO_PARA_DESPACHO',
        total: 0,
        created_at: fechaActual,
        updated_at: fechaActual,
      });
    }

    await queryInterface.bulkInsert(
      'pedidos',
      pedidos,
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('pedidos', {
      id: [
        1, 2, 3, 4, 5, 6, 7,
        8, 9, 10, 11, 12, 13, 14,
      ],
    });
  },
};

