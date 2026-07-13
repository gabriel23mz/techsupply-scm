import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import sequelize from './src/config/database.js';

import './src/models/index.js';


import authRoutes from './src/routes/auth.routes.js';
import ubicacionRoutes from './src/routes/ubicacion.routes.js';
import clienteRoutes from './src/routes/cliente.routes.js';
import rutaRoutes from './src/routes/ruta.routes.js';
import usuarioRoutes from './src/routes/usuario.routes.js';
import categoriaRoutes from './src/routes/categoria.routes.js';
import productoRoutes from './src/routes/producto.routes.js';
import pedidoRoutes from './src/routes/pedido.routes.js';
import detallePedidoRoutes from './src/routes/detallePedido.routes.js';
import despachoRoutes from './src/routes/despacho.routes.js';
import jornadaRepartoRoutes from './src/routes/jornadaReparto.routes.js';
import camionRoutes from './src/routes/camion.routes.js';

import notFound from './src/middlewares/notFound.js';
import errorHandler from './src/middlewares/errorHandler.js';


dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
  ],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
  ],
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/ubicaciones', ubicacionRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/rutas', rutaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/detalles-pedido', detallePedidoRoutes);
app.use('/api/despachos', despachoRoutes);
app.use('/api/jornadas-reparto', jornadaRepartoRoutes);
app.use('/api/camiones', camionRoutes);


app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();

    console.log(
      '✅ Conexión a PostgreSQL Supabase exitosa',
    );

    app.listen(PORT, () => {
      console.log(
        `🚀 Servidor ejecutándose en puerto ${PORT}`,
      );

      console.log(
        `🔗 URL: http://localhost:${PORT}/`,
      );
    });
  } catch (error) {
    console.error(
      '❌ Error al conectar con PostgreSQL Supabase:',
    );

    console.error(error);

    process.exit(1);
  }
}

startServer();

