'use strict';

module.exports = {
  async up(queryInterface) {
    const fechaActual = new Date();

    await queryInterface.bulkInsert('proveedores', [
      {
        id: 1,
        nombre: 'Importadora Tecnológica del Ecuador',
        ruc: '1391000001001',
        telefono: '0991000001',
        correo: 'ventas@importec.com',
        direccion: 'Avenida Principal, Guayaquil',
        estado: true,
        created_at: fechaActual,
        updated_at: fechaActual,
      },
      {
        id: 2,
        nombre: 'Distribuidora Digital Manabí',
        ruc: '1391000002001',
        telefono: '0991000002',
        correo: 'contacto@digitalmanabi.com',
        direccion: 'Avenida Manabí, Portoviejo',
        estado: true,
        created_at: fechaActual,
        updated_at: fechaActual,
      },
      {
        id: 3,
        nombre: 'CompuPartes Ecuador',
        ruc: '1391000003001',
        telefono: '0991000003',
        correo: 'pedidos@compupartes.ec',
        direccion: 'Avenida 4 de Noviembre, Manta',
        estado: true,
        created_at: fechaActual,
        updated_at: fechaActual,
      },
      {
        id: 4,
        nombre: 'Soluciones de Redes S.A.',
        ruc: '1391000004001',
        telefono: '0991000004',
        correo: 'ventas@redesecuador.com',
        direccion: 'Sector Norte, Quito',
        estado: true,
        created_at: fechaActual,
        updated_at: fechaActual,
      },
      {
        id: 5,
        nombre: 'Suministros Informáticos Nacionales',
        ruc: '1391000005001',
        telefono: '0991000005',
        correo: 'info@suministrosinformaticos.ec',
        direccion: 'Centro Comercial Tecnológico, Guayaquil',
        estado: true,
        created_at: fechaActual,
        updated_at: fechaActual,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('proveedores', {
      id: [1, 2, 3, 4, 5],
    });
  },
};

