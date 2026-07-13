import { Router } from 'express';

import {
  obtenerPorId,
  obtenerTodos,
} from '../controllers/camion.controller.js';

const router = Router();

/*
|--------------------------------------------------------------------------
| Consulta de camiones
|--------------------------------------------------------------------------
|
| Este módulo es únicamente informativo.
| No expone operaciones POST, PUT, PATCH o DELETE.
|--------------------------------------------------------------------------
*/

router.get(
  '/',
  obtenerTodos,
);

router.get(
  '/:id',
  obtenerPorId,
);

export default router;

