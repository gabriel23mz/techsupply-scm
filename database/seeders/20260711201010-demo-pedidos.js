'use strict';

const {
  atTimezoneOffset,
  orderStateForId,
  orderCreatedOffset,
  clientIdForOrder,
  deliveredAtForOrder,
} = require('../support/demoData.cjs');

module.exports = {
  async up(queryInterface) {
    const rows = [];

    for (let id = 1; id <= 72; id += 1) {
      const estado = orderStateForId(id);
      const created = atTimezoneOffset(
        orderCreatedOffset(id),
        9 + (id % 7),
        5 * (id % 6),
      );
      const sellerId = 2 + ((id - 1) % 3);
      const sentAt = [
        'PREPARANDO',
        'LISTO_PARA_DESPACHO',
        'DESPACHADO',
        'ENTREGADO',
        'REPROGRAMADO',
      ].includes(estado)
        ? new Date(created.getTime() + 2 * 60 * 60 * 1000)
        : null;
      const preparationFinishedAt = [
        'LISTO_PARA_DESPACHO',
        'DESPACHADO',
        'ENTREGADO',
        'REPROGRAMADO',
      ].includes(estado)
        ? new Date(created.getTime() + 6 * 60 * 60 * 1000)
        : null;
      const deliveredAt = deliveredAtForOrder(id);

      rows.push({
        id,
        cliente_id: clientIdForOrder(id),
        usuario_id: sellerId,
        creado_por_usuario_id: sellerId,
        enviado_preparacion_por_usuario_id: sentAt ? sellerId : null,
        enviado_preparacion_en: sentAt,
        preparacion_finalizada_por_usuario_id: preparationFinishedAt
          ? (id % 2 === 0 ? 5 : 6)
          : null,
        preparacion_finalizada_en: preparationFinishedAt,
        fecha: created,
        fecha_entrega: deliveredAt,
        estado,
        total: 0,
        created_at: created,
        updated_at: deliveredAt || preparationFinishedAt || sentAt || created,
      });
    }

    await queryInterface.bulkInsert('pedidos', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('pedidos', {
      id: Array.from({ length: 72 }, (_, index) => index + 1),
    });
  },
};
