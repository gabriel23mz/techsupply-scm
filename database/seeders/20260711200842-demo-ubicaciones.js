'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('ubicaciones', [
      {
        id: 1,
        nombre: 'Bodega Central Calceta',
        latitud: -0.85050000,
        longitud: -80.16450000,
        estado: true,
      },
      {
        id: 2,
        nombre: 'Calceta',
        latitud: -0.84582000,
        longitud: -80.16389000,
        estado: true,
      },
      {
        id: 3,
        nombre: 'Tosagua',
        latitud: -0.78601000,
        longitud: -80.23473000,
        estado: true,
      },
      {
        id: 4,
        nombre: 'Chone',
        latitud: -0.69819000,
        longitud: -80.09361000,
        estado: true,
      },
      {
        id: 5,
        nombre: 'El Carmen',
        latitud: -0.26730000,
        longitud: -79.45932000,
        estado: true,
      },
      {
        id: 6,
        nombre: 'Rocafuerte',
        latitud: -0.92360000,
        longitud: -80.44946000,
        estado: true,
      },
      {
        id: 7,
        nombre: 'Portoviejo',
        latitud: -1.05458000,
        longitud: -80.45445000,
        estado: true,
      },
      {
        id: 8,
        nombre: 'Manta',
        latitud: -0.96765000,
        longitud: -80.70891000,
        estado: true,
      },
      {
        id: 9,
        nombre: 'Montecristi',
        latitud: -1.04576000,
        longitud: -80.65889000,
        estado: true,
      },
      {
        id: 10,
        nombre: 'Bahía de Caráquez',
        latitud: -0.60030000,
        longitud: -80.42370000,
        estado: true,
      },
      {
        id: 11,
        nombre: 'San Vicente',
        latitud: -0.59310000,
        longitud: -80.40800000,
        estado: true,
      },
      {
        id: 12,
        nombre: 'Jipijapa',
        latitud: -1.34872000,
        longitud: -80.57875000,
        estado: true,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('ubicaciones', {
      id: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    });
  },
};

