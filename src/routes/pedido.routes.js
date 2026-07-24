import {
  Router,
} from 'express';

import * as pedidoController
  from '../controllers/pedido.controller.js';

import * as requestValidators
  from '../middlewares/requestValidators.js';

const router = Router();

router.get(
  '/',
  pedidoController.obtenerTodos,
);

router.get(
  '/:id',
  requestValidators.validarIdParam,
  pedidoController.obtenerPorId,
);

router.post(
  '/',
  requestValidators.validarCrearPedido,
  pedidoController.crear,
);

router.put(
  '/:id',
  requestValidators.validarIdParam,
  pedidoController.actualizar,
);

router.delete(
  '/:id',
  requestValidators.validarIdParam,
  pedidoController.eliminar,
);

router.patch(
  '/:id/preparar',
  requestValidators.validarIdParam,
  pedidoController.preparar,
);

router.patch(
  '/:id/finalizar-preparacion',
  requestValidators.validarIdParam,
  pedidoController.finalizarPreparacion,
);

router.patch(
  '/:id/cancelar',
  requestValidators.validarIdParam,
  pedidoController.cancelar,
);

export default router;
