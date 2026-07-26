import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

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

const sequelizeOptions = {
  dialect: 'postgres',
  logging: false,

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

if (useSsl) {
  sequelizeOptions.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

const sequelize = new Sequelize(
  databaseUrl,
  sequelizeOptions,
);

export default sequelize;
