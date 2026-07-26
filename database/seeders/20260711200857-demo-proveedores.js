'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const names = [
      'Importadora Tecnológica del Ecuador',
      'Distribuidora Digital Manabí',
      'CompuPartes Ecuador',
      'Soluciones de Redes S.A.',
      'Suministros Informáticos Nacionales',
      'Energía Segura Ecuador',
      'Impresión Profesional Andina',
      'Movilidad y Accesorios S.A.',
      'Seguridad Electrónica del Pacífico',
      'Consumibles Empresariales Ecuador',
    ];

    await queryInterface.bulkInsert(
      'proveedores',
      names.map((nombre, index) => {
        const id = index + 1;
        return {
          id,
          nombre,
          ruc: `1392${String(100000 + id).padStart(6, '0')}001`,
          telefono: `09${String(87000000 + id).padStart(8, '0')}`,
          correo: `proveedor${id}@demo.techsupply.ec`,
          direccion: `Zona industrial ${id}, Ecuador`,
          estado: id !== 10,
          created_at: now,
          updated_at: now,
        };
      }),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('proveedores', {
      id: Array.from({ length: 10 }, (_, index) => index + 1),
    });
  },
};
