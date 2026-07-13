'use strict';

const TABLAS = [
  'usuarios',
  'categorias',
  'ubicaciones',
  'proveedores',
  'camiones',
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
    for (const tabla of TABLAS) {
      /*
       * Si la tabla contiene registros:
       *   la próxima inserción será MAX(id) + 1.
       *
       * Si está vacía:
       *   la próxima inserción comenzará en 1.
       */
      await queryInterface.sequelize.query(`
        SELECT setval(
          pg_get_serial_sequence('"${tabla}"', 'id'),
          COALESCE(
            (SELECT MAX("id") FROM "${tabla}"),
            1
          ),
          EXISTS(
            SELECT 1
            FROM "${tabla}"
          )
        );
      `);
    }
  },

  async down() {
    /*
     * No modificamos las secuencias aquí porque este seeder
     * se revierte antes que los seeders que eliminan los datos.
     */
  },
};


