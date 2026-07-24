'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_usuarios_rol"
      ADD VALUE IF NOT EXISTS 'CHOFER';
    `);

    await queryInterface.createTable('choferes', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'usuarios',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      numero_licencia: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },

      categoria_licencia: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },

      fecha_vencimiento_licencia: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('choferes', ['usuario_id'], {
      name: 'choferes_usuario_idx',
    });

    await queryInterface.addIndex('choferes', ['numero_licencia'], {
      name: 'choferes_numero_licencia_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('choferes');

    /*
     * PostgreSQL no elimina valores de enum con una operación simple y segura.
     * Para revertir CHOFER se debe recrear "enum_usuarios_rol" sin ese valor,
     * migrando temporalmente la columna usuarios.rol a un tipo auxiliar.
     */
  },
};
