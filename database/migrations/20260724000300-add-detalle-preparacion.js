'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.addColumn('detalle_pedido', 'cantidad_preparada', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('detalle_pedido', 'preparado_por_usuario_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('detalle_pedido', 'fecha_preparacion', {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE "detalle_pedido" AS "detalle"
      SET "cantidad_preparada" = "detalle"."cantidad"
      FROM "pedidos" AS "pedido"
      WHERE "pedido"."id" = "detalle"."pedido_id"
        AND "pedido"."estado" IN (
          'LISTO_PARA_DESPACHO',
          'DESPACHADO',
          'ENTREGADO',
          'REPROGRAMADO'
        );
    `);

    await queryInterface.addIndex('detalle_pedido', ['pedido_id'], {
      name: 'detalle_pedido_pedido_idx',
    });

    await queryInterface.addConstraint('detalle_pedido', {
      fields: ['cantidad_preparada'],
      type: 'check',
      name: 'detalle_pedido_cantidad_preparada_check',
      where: Sequelize.literal(
        'cantidad_preparada >= 0 AND cantidad_preparada <= cantidad',
      ),
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(
      'detalle_pedido',
      'detalle_pedido_cantidad_preparada_check',
    );

    await queryInterface.removeIndex(
      'detalle_pedido',
      'detalle_pedido_pedido_idx',
    );

    await queryInterface.removeColumn('detalle_pedido', 'fecha_preparacion');
    await queryInterface.removeColumn('detalle_pedido', 'preparado_por_usuario_id');
    await queryInterface.removeColumn('detalle_pedido', 'cantidad_preparada');
  },
};
