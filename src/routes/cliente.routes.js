import {
  Router,
} from 'express';

import * as clienteController
  from '../controllers/cliente.controller.js';

import * as requestValidators
  from '../middlewares/requestValidators.js';

const router = Router();

router.get(
  '/',
  clienteController.obtenerTodos,
);

router.get(
  '/:id',
  requestValidators.validarIdParam,
  clienteController.obtenerPorId,
);

router.post(
  '/',
  requestValidators.validarCrearCliente,
  clienteController.crear,
);

router.put(
  '/:id',
  requestValidators.validarIdParam,
  requestValidators.validarActualizarCliente,
  clienteController.actualizar,
);

router.delete(
  '/:id',
  requestValidators.validarIdParam,
  clienteController.eliminar,
);

export default router;
