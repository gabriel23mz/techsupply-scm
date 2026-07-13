'use strict';

module.exports = {
  async up(queryInterface) {
    const fechaActual = new Date();

    const conexiones = [
      [1, 2, 0.70],
      [2, 3, 19.00],
      [2, 4, 28.00],
      [3, 4, 22.00],
      [4, 5, 62.00],
      [3, 6, 42.00],
      [6, 7, 25.00],
      [7, 8, 35.00],
      [7, 9, 30.00],
      [9, 8, 12.00],
      [3, 10, 43.00],
      [10, 11, 3.00],
      [7, 12, 45.00],
      [6, 10, 38.00],
      [4, 10, 52.00],
    ];

    const rutas = [];
    let id = 1;

    for (const [origen, destino, distancia] of conexiones) {
      rutas.push({
        id: id++,
        origen_id: origen,
        destino_id: destino,
        distancia_km: distancia,
        estado: true,
        created_at: fechaActual,
        updated_at: fechaActual,
      });

      rutas.push({
        id: id++,
        origen_id: destino,
        destino_id: origen,
        distancia_km: distancia,
        estado: true,
        created_at: fechaActual,
        updated_at: fechaActual,
      });
    }

    await queryInterface.bulkInsert('rutas', rutas);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('rutas', {
      id: Array.from(
        { length: 30 },
        (_, index) => index + 1,
      ),
    });
  },
};

