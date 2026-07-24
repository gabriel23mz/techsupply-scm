import {
  Router,
} from 'express';

import * as productoController
  from '../controllers/producto.controller.js';

import * as requestValidators
  from '../middlewares/requestValidators.js';

const router = Router();

router.get(
  '/',
  productoController.obtenerTodos,
);

router.get(
  '/:id',
  requestValidators.validarIdParam,
  productoController.obtenerPorId,
);

router.post(
  '/',
  requestValidators.validarCrearProducto,
  productoController.crear,
);

router.put(
  '/:id',
  requestValidators.validarIdParam,
  requestValidators.validarActualizarProducto,
  productoController.actualizar,
);

router.delete(
  '/:id',
  requestValidators.validarIdParam,
  productoController.eliminar,
);

export default router;
