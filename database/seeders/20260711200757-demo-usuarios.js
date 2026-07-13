'use strict';

const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface) {
    const fechaActual = new Date();

    await queryInterface.bulkInsert('usuarios', [
      {
        id: 1,
        nombre: 'Administrador',
        apellido: 'TechSupply',
        correo: 'admin@techsupply.com',
        password_hash: await bcrypt.hash('Admin123*', 10),
        rol: 'ADMIN',
        estado: true,
        created_at: fechaActual,
        updated_at: fechaActual,
      },
      {
        id: 2,
        nombre: 'Gabriel',
        apellido: 'Moreira',
        correo: 'gabriel23m11z@gmail.com',
        password_hash: await bcrypt.hash('Admin123*', 10),
        rol: 'ADMIN',
        estado: true,
        created_at: fechaActual,
        updated_at: fechaActual,
      },
      {
        id: 3,
        nombre: 'Carlos',
        apellido: 'Mendoza',
        correo: 'ventas@techsupply.com',
        password_hash: await bcrypt.hash('Ventas123*', 10),
        rol: 'VENTAS',
        estado: true,
        created_at: fechaActual,
        updated_at: fechaActual,
      },
      {
        id: 4,
        nombre: 'María',
        apellido: 'Zambrano',
        correo: 'logistica@techsupply.com',
        password_hash: await bcrypt.hash('Logistica123*', 10),
        rol: 'LOGISTICA',
        estado: true,
        created_at: fechaActual,
        updated_at: fechaActual,
      },
      {
        id: 5,
        nombre: 'José',
        apellido: 'Cedeño',
        correo: 'bodega@techsupply.com',
        password_hash: await bcrypt.hash('Bodega123*', 10),
        rol: 'BODEGA',
        estado: true,
        created_at: fechaActual,
        updated_at: fechaActual,
      },
      {
        id: 6,
        nombre: 'Andrea',
        apellido: 'Vélez',
        correo: 'compras@techsupply.com',
        password_hash: await bcrypt.hash('Compras123*', 10),
        rol: 'COMPRAS',
        estado: true,
        created_at: fechaActual,
        updated_at: fechaActual,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('usuarios', {
      id: [1, 2, 3, 4, 5, 6],
    });
  },
};

