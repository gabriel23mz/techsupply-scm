'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('categorias', [
      {
        id: 1,
        nombre: 'Computadoras',
        descripcion: 'Computadoras de escritorio, portátiles y estaciones de trabajo.',
        estado: true,
      },
      {
        id: 2,
        nombre: 'Componentes',
        descripcion: 'Procesadores, memorias, discos y componentes internos.',
        estado: true,
      },
      {
        id: 3,
        nombre: 'Periféricos',
        descripcion: 'Teclados, ratones, cámaras y accesorios de entrada.',
        estado: true,
      },
      {
        id: 4,
        nombre: 'Monitores',
        descripcion: 'Monitores para oficina, diseño y uso profesional.',
        estado: true,
      },
      {
        id: 5,
        nombre: 'Redes',
        descripcion: 'Routers, switches, puntos de acceso y cableado.',
        estado: true,
      },
      {
        id: 6,
        nombre: 'Almacenamiento',
        descripcion: 'Discos duros, SSD y unidades externas.',
        estado: true,
      },
      {
        id: 7,
        nombre: 'Impresión',
        descripcion: 'Impresoras, escáneres y suministros de impresión.',
        estado: true,
      },
      {
        id: 8,
        nombre: 'Energía',
        descripcion: 'UPS, reguladores, baterías y protección eléctrica.',
        estado: true,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('categorias', {
      id: [1, 2, 3, 4, 5, 6, 7, 8],
    });
  },
};

