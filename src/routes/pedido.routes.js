import { Router } from 'express';

import {
  obtenerTodos,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
  preparar,
  finalizarPreparacion,
  cancelar,
} from '../controllers/pedido.controller.js';

const router = Router();

router.get('/', obtenerTodos);

router.get('/:id', obtenerPorId);

router.post('/', crear);

router.put('/:id', actualizar);

router.delete('/:id', eliminar);

router.patch('/:id/preparar', preparar);

router.patch('/:id/finalizar-preparacion', finalizarPreparacion);

router.patch('/:id/cancelar', cancelar);

export default router;
