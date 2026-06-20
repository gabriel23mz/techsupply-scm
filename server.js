import express from 'express';
import dotenv from 'dotenv';

import sequelize from './src/config/database.js';

import './src/models/index.js';

import ubicacionRoutes from './src/routes/ubicacion.routes.js';
import clienteRoutes from './src/routes/cliente.routes.js';
import rutaRoutes from './src/routes/ruta.routes.js';
import usuarioRoutes from './src/routes/usuario.routes.js';
import categoriaRoutes from './src/routes/categoria.routes.js';
import productoRoutes from './src/routes/producto.routes.js';


import notFound from './src/middlewares/notFound.js';
import errorHandler from './src/middlewares/errorHandler.js';

dotenv.config();

const app = express();

app.use(express.json());

app.use('/api/ubicaciones', ubicacionRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/rutas', rutaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);


app.use(notFound);

app.use(errorHandler);


const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();

    console.log('✅ Conexión a MySQL exitosa');

    await sequelize.sync({ alter: false });

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
