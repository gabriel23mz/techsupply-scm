'use strict';

const { buildJourneyDefinitions } = require('../support/demoData.cjs');

module.exports = {
  async up(queryInterface) {
    const rows = buildJourneyDefinitions().map((journey) => ({
      id: journey.id,
      camion_id: journey.truck,
      chofer_id: journey.driver,
      carga_confirmada_por_usuario_id: journey.loadingUser,
      carga_confirmada_en: journey.loadingAt,
      fecha: journey.date,
      inicio_estimado_en: journey.startEstimated,
      retorno_estimado_en: journey.returnEstimated,
      fecha_salida: journey.startReal,
      fecha_finalizacion: journey.endReal,
      estado: journey.state,
      posicion_actual_orden: journey.currentOrder,
      ruta_json: journey.route
        ? JSON.stringify(journey.route)
        : null,
      distancia_total: journey.totalDistance,
      tiempo_estimado: journey.totalTravelMinutes,
      created_at: journey.startEstimated,
      updated_at:
        journey.endReal || journey.startReal || journey.loadingAt || journey.startEstimated,
    }));

    await queryInterface.bulkInsert('jornadas_reparto', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('jornadas_reparto', {
      id: buildJourneyDefinitions().map((journey) => journey.id),
    });
  },
};
