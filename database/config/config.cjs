const path = require('path');

require('dotenv').config({
  path: path.resolve(
    __dirname,
    '../../.env',
  ),
});

const databaseUrl =
  process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error(
    'La variable DATABASE_URL no está configurada en el archivo .env',
  );
}

const useSsl =
  String(process.env.DB_SSL ?? 'false')
    .trim()
    .toLowerCase() === 'true';

const baseConfig = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  logging: false,

  pool: {
    max: 2,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },

  migrationStorage: 'sequelize',
  migrationStorageTableName:
    'SequelizeMeta',

  seederStorage: 'sequelize',
  seederStorageTableName:
    'SequelizeData',
};

if (useSsl) {
  baseConfig.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

module.exports = {
  development: {
    ...baseConfig,
  },

  test: {
    ...baseConfig,
  },

  production: {
    ...baseConfig,
  },
};



