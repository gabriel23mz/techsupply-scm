'use strict';

module.exports = {
  async up(queryInterface) {
    const fechaActual = new Date();

    await queryInterface.bulkInsert('camiones', [
      {
        id: 1,
        codigo: 'CAM-001',
        placa: 'MAB-1001',
        descripcion: 'Camión principal para rutas de larga distancia.',
        capacidad: 5,
        estado: 'EN_BODEGA',
        created_at: fechaActual,
        updated_at: fechaActual,
      },
      {
        id: 2,
        codigo: 'CAM-002',
        placa: 'MAB-1002',
        descripcion: 'Camión secundario para rutas interprovinciales.',
        capacidad: 5,
        estado: 'EN_BODEGA',
        created_at: fechaActual,
        updated_at: fechaActual,
      },
      {
        id: 3,
        codigo: 'CAM-003',
        placa: 'MAB-1003',
        descripcion: 'Vehículo liviano para entregas complementarias.',
        capacidad: 4,
        estado: 'EN_BODEGA',
        created_at: fechaActual,
        updated_at: fechaActual,
      },
      {
        id: 4,
        codigo: 'CAM-004',
        placa: 'MAB-1004',
        descripcion: 'Vehículo de respaldo actualmente inactivo.',
        capacidad: 4,
        estado: 'INACTIVO',
        created_at: fechaActual,
        updated_at: fechaActual,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('camiones', {
      id: [1, 2, 3, 4],
    });
  },
};

