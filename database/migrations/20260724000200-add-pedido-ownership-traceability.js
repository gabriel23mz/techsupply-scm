'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.addColumn('pedidos', 'creado_por_usuario_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('pedidos', 'enviado_preparacion_por_usuario_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('pedidos', 'enviado_preparacion_en', {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('pedidos', 'preparacion_finalizada_por_usuario_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('pedidos', 'preparacion_finalizada_en', {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex('pedidos', ['creado_por_usuario_id'], {
      name: 'pedidos_creado_por_usuario_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'pedidos',
      'pedidos_creado_por_usuario_idx',
    );

    await queryInterface.removeColumn('pedidos', 'preparacion_finalizada_en');
    await queryInterface.removeColumn('pedidos', 'preparacion_finalizada_por_usuario_id');
    await queryInterface.removeColumn('pedidos', 'enviado_preparacion_en');
    await queryInterface.removeColumn('pedidos', 'enviado_preparacion_por_usuario_id');
    await queryInterface.removeColumn('pedidos', 'creado_por_usuario_id');
  },
};
