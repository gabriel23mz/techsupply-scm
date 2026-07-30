'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const definitions = [
      [1, 'CAM-001', 'MAB-2001', 'Camión mediano para rutas regionales.', 8, 'EN_BODEGA'],
      [2, 'CAM-002', 'MAB-2002', 'Camión mediano para rutas regionales.', 8, 'EN_BODEGA'],
      [3, 'CAM-003', 'MAB-2003', 'Camión de larga distancia disponible para planificación.', 14, 'EN_BODEGA'],
      [4, 'CAM-004', 'MAB-2004', 'Camión de alta capacidad para rutas interprovinciales.', 16, 'EN_BODEGA'],
      [5, 'CAM-005', 'MAB-2005', 'Camión de alta capacidad para rutas interprovinciales.', 16, 'EN_BODEGA'],
      [6, 'CAM-006', 'MAB-2006', 'Vehículo liviano para entregas cercanas.', 5, 'EN_BODEGA'],
      [7, 'CAM-007', 'MAB-2007', 'Vehículo liviano de apoyo logístico.', 6, 'EN_BODEGA'],
      [8, 'CAM-008', 'MAB-2008', 'Camión de respaldo operativo.', 10, 'EN_BODEGA'],
      [9, 'CAM-009', 'MAB-2009', 'Camión disponible para jornadas nuevas.', 12, 'EN_BODEGA'],
      [10, 'CAM-010', 'MAB-2010', 'Vehículo fuera de operación para pruebas.', 7, 'INACTIVO'],
    ];

    await queryInterface.bulkInsert(
      'camiones',
      definitions.map(([id, codigo, placa, descripcion, capacidad, estado]) => ({
        id,
        codigo,
        placa,
        descripcion,
        capacidad,
        estado,
        created_at: now,
        updated_at: now,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('camiones', {
      id: Array.from({ length: 10 }, (_, index) => index + 1),
    });
  },
};
