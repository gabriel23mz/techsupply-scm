import express from 'express';
import dotenv from 'dotenv';
import sequelize from './src/config/database.js';
import './src/models/index.js';

dotenv.config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();

    console.log('✅ Conexión a MySQL exitosa');

    await sequelize.sync({ force: true });

    console.log('✅ Tablas sincronizadas correctamente');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`🔗 URL: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('❌ Error al conectar MySQL:');
    console.error(error);
  }
}

startServer();
