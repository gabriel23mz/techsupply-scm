'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "jornadas_reparto"
      ALTER COLUMN "ruta_json"
      TYPE JSONB
      USING CASE
        WHEN "ruta_json" IS NULL THEN NULL
        ELSE "ruta_json"::jsonb
      END;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "despachos"
      ALTER COLUMN "ruta_json"
      TYPE JSONB
      USING CASE
        WHEN "ruta_json" IS NULL THEN NULL
        ELSE "ruta_json"::jsonb
      END;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "jornadas_reparto"
      ALTER COLUMN "ruta_json"
      TYPE TEXT
      USING CASE
        WHEN "ruta_json" IS NULL THEN NULL
        ELSE "ruta_json"::text
      END;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE "despachos"
      ALTER COLUMN "ruta_json"
      TYPE TEXT
      USING CASE
        WHEN "ruta_json" IS NULL THEN NULL
        ELSE "ruta_json"::text
      END;
    `);
  },
};