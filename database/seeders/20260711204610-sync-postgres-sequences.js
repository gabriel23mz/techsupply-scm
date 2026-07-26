'use strict';

const TABLES = [
  'usuarios',
  'categorias',
  'ubicaciones',
  'proveedores',
  'camiones',
  'choferes',
  'productos',
  'clientes',
  'rutas',
  'pedidos',
  'detalle_pedido',
  'jornadas_reparto',
  'despachos',
  'ordenes_compra',
  'detalle_orden_compra',
  'ingresos_inventario',
  'detalle_ingreso',
];

module.exports = {
  async up(queryInterface) {
    for (const table of TABLES) {
      await queryInterface.sequelize.query(`
        SELECT setval(
          pg_get_serial_sequence('"${table}"', 'id'),
          COALESCE((SELECT MAX("id") FROM "${table}"), 1),
          EXISTS(SELECT 1 FROM "${table}")
        );
      `);
    }
  },

  async down() {
    // Las secuencias se reajustan al volver a ejecutar los seeders.
  },
};
