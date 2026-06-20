import { Router } from 'express';

import {
  obtenerTodas,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
} from '../controllers/ruta.controller.js';

const router = Router();

router.get('/', obtenerTodas);

router.get('/:id', obtenerPorId);

router.post('/', crear);

router.put('/:id', actualizar);

router.delete('/:id', eliminar);

export default router;
