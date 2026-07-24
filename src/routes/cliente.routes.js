import {
  Router,
} from 'express';

import * as clienteController
  from '../controllers/cliente.controller.js';

import * as requestValidators
  from '../middlewares/requestValidators.js';

import * as authMiddleware
  from '../middlewares/auth.middleware.js';

import * as authorizationMiddleware
  from '../middlewares/authorization.middleware.js';

import {
  PERMISSIONS,
} from '../constants/permissions.js';

const router = Router();

router.use(
  authMiddleware.requireAuth,
);

router.get(
  '/',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CLIENTES_LEER,
  ),
  clienteController.obtenerTodos,
);

router.get(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CLIENTES_LEER,
  ),
  requestValidators.validarIdParam,
  clienteController.obtenerPorId,
);

router.post(
  '/',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CLIENTES_GESTIONAR,
  ),
  requestValidators.validarCrearCliente,
  clienteController.crear,
);

router.put(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CLIENTES_GESTIONAR,
  ),
  requestValidators.validarIdParam,
  requestValidators.validarActualizarCliente,
  clienteController.actualizar,
);

router.delete(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CLIENTES_GESTIONAR,
  ),
  requestValidators.validarIdParam,
  clienteController.eliminar,
);

export default router;
