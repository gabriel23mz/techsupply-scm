import { Router } from 'express';

import {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
} from '../controllers/pedido.controller.js';

const router = Router();

router.get('/', obtenerTodos);

router.get('/:id', obtenerPorId);

router.post('/', crear);

router.put('/:id', actualizar);

router.delete('/:id', eliminar);

export default router;
