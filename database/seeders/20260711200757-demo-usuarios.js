'use strict';

const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const definitions = [
      [1, 'Administrador', 'TechSupply', 'admin@demo.techsupply.ec', 'ADMIN', 'Admin123*', true],
      [2, 'Carlos', 'Mendoza', 'ventas1@demo.techsupply.ec', 'VENTAS', 'Ventas123*', true],
      [3, 'Andrea', 'Cedeño', 'ventas2@demo.techsupply.ec', 'VENTAS', 'Ventas123*', true],
      [4, 'Lucía', 'Zambrano', 'ventas3@demo.techsupply.ec', 'VENTAS', 'Ventas123*', true],
      [5, 'María', 'Mera', 'bodega1@demo.techsupply.ec', 'BODEGA', 'Bodega123*', true],
      [6, 'José', 'Vélez', 'bodega2@demo.techsupply.ec', 'BODEGA', 'Bodega123*', true],
      [7, 'Daniela', 'Moreira', 'logistica1@demo.techsupply.ec', 'LOGISTICA', 'Logistica123*', true],
      [8, 'Luis', 'Alcívar', 'logistica2@demo.techsupply.ec', 'LOGISTICA', 'Logistica123*', true],
      [9, 'Karla', 'Cedeño', 'compras1@demo.techsupply.ec', 'COMPRAS', 'Compras123*', true],
      [10, 'Miguel', 'Ponce', 'compras2@demo.techsupply.ec', 'COMPRAS', 'Compras123*', true],
      [11, 'Pedro', 'Loor', 'chofer1@demo.techsupply.ec', 'CHOFER', 'Chofer123*', true],
      [12, 'Jorge', 'Macías', 'chofer2@demo.techsupply.ec', 'CHOFER', 'Chofer123*', true],
      [13, 'Ricardo', 'Bravo', 'chofer3@demo.techsupply.ec', 'CHOFER', 'Chofer123*', true],
      [14, 'Manuel', 'Delgado', 'chofer4@demo.techsupply.ec', 'CHOFER', 'Chofer123*', true],
      [15, 'Héctor', 'Quijije', 'chofer5@demo.techsupply.ec', 'CHOFER', 'Chofer123*', true],
      [16, 'Óscar', 'Mendoza', 'chofer6@demo.techsupply.ec', 'CHOFER', 'Chofer123*', true],
      [17, 'Víctor', 'Palma', 'chofer7@demo.techsupply.ec', 'CHOFER', 'Chofer123*', true],
      [18, 'Raúl', 'García', 'chofer8@demo.techsupply.ec', 'CHOFER', 'Chofer123*', false],
    ];

    const rows = [];
    for (const [id, nombre, apellido, correo, rol, password, estado] of definitions) {
      rows.push({
        id,
        nombre,
        apellido,
        correo,
        password_hash: await bcrypt.hash(password, 10),
        rol,
        estado,
        created_at: now,
        updated_at: now,
      });
    }

    await queryInterface.bulkInsert('usuarios', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('usuarios', {
      id: Array.from({ length: 18 }, (_, index) => index + 1),
    });
  },
};
