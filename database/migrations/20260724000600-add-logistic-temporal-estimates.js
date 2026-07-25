'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.addColumn(
      'jornadas_reparto',
      'inicio_estimado_en',
      {
        type: DataTypes.DATE,
        allowNull: true,
      },
    );

    await queryInterface.addColumn(
      'jornadas_reparto',
      'retorno_estimado_en',
      {
        type: DataTypes.DATE,
        allowNull: true,
      },
    );

    await queryInterface.changeColumn(
      'pedidos',
      'fecha_entrega',
      {
        type: DataTypes.DATE,
        allowNull: true,
      },
    );
  },

  async down(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.changeColumn(
      'pedidos',
      'fecha_entrega',
      {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
    );

    await queryInterface.removeColumn(
      'jornadas_reparto',
      'retorno_estimado_en',
    );

    await queryInterface.removeColumn(
      'jornadas_reparto',
      'inicio_estimado_en',
    );
  },
};
