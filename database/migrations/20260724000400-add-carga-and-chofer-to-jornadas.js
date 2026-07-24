'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.addColumn('despachos', 'cargado', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('despachos', 'cargado_por_usuario_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('despachos', 'fecha_carga', {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('jornadas_reparto', 'chofer_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'choferes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('jornadas_reparto', 'carga_confirmada_por_usuario_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('jornadas_reparto', 'carga_confirmada_en', {
      type: DataTypes.DATE,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      UPDATE "despachos" AS "despacho"
      SET "cargado" = true
      FROM "jornadas_reparto" AS "jornada"
      WHERE "jornada"."id" = "despacho"."jornada_reparto_id"
        AND "jornada"."estado" IN ('EN_RUTA', 'FINALIZADA');
    `);

    await queryInterface.addIndex('despachos', ['jornada_reparto_id', 'cargado'], {
      name: 'despachos_jornada_cargado_idx',
    });

    await queryInterface.addIndex('jornadas_reparto', ['chofer_id', 'estado'], {
      name: 'jornadas_reparto_chofer_estado_idx',
    });

    await queryInterface.addIndex('jornadas_reparto', ['chofer_id', 'fecha'], {
      name: 'jornadas_reparto_chofer_fecha_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'jornadas_reparto',
      'jornadas_reparto_chofer_fecha_idx',
    );

    await queryInterface.removeIndex(
      'jornadas_reparto',
      'jornadas_reparto_chofer_estado_idx',
    );

    await queryInterface.removeIndex(
      'despachos',
      'despachos_jornada_cargado_idx',
    );

    await queryInterface.removeColumn('jornadas_reparto', 'carga_confirmada_en');
    await queryInterface.removeColumn('jornadas_reparto', 'carga_confirmada_por_usuario_id');
    await queryInterface.removeColumn('jornadas_reparto', 'chofer_id');
    await queryInterface.removeColumn('despachos', 'fecha_carga');
    await queryInterface.removeColumn('despachos', 'cargado_por_usuario_id');
    await queryInterface.removeColumn('despachos', 'cargado');
  },
};
