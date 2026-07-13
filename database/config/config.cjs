require('dotenv').config({
  path: require('path').resolve(__dirname, '../../.env'),
});

if (!process.env.DATABASE_URL) {
  throw new Error(
    'La variable DATABASE_URL no está configurada en el archivo .env',
  );
}


const baseConfig = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  logging: false,

  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },

  pool: {
    max: 2,
    min: 0,
    acquire: 60000,
    idle: 10000,
  },

  migrationStorage: 'sequelize',
  migrationStorageTableName: 'SequelizeMeta',

  seederStorage: 'sequelize',
  seederStorageTableName: 'SequelizeData',
};


module.exports = {
  development: baseConfig,
  test: baseConfig,
  production: baseConfig,
};

