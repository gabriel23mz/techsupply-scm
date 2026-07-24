import {
  Router,
} from 'express';

import * as detallePedidoController
  from '../controllers/detallePedido.controller.js';

import * as requestValidators
  from '../middlewares/requestValidators.js';

const router = Router();

router.get(
  '/',
  detallePedidoController.obtenerTodos,
);

router.get(
  '/:id',
  requestValidators.validarIdParam,
  detallePedidoController.obtenerPorId,
);

router.post(
  '/',
  requestValidators.validarCrearDetallePedido,
  detallePedidoController.crear,
);

router.put(
  '/:id',
  requestValidators.validarIdParam,
  requestValidators.validarActualizarDetallePedido,
  detallePedidoController.actualizar,
);

router.delete(
  '/:id',
  requestValidators.validarIdParam,
  detallePedidoController.eliminar,
);

export default router;
