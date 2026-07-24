import {
  Router,
} from 'express';

import * as detallePedidoController
  from '../controllers/detallePedido.controller.js';

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
    PERMISSIONS.PEDIDOS_LEER,
  ),
  detallePedidoController.obtenerTodos,
);

router.get(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.PEDIDOS_LEER,
  ),
  requestValidators.validarIdParam,
  detallePedidoController.obtenerPorId,
);

router.post(
  '/',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.PEDIDOS_EDITAR,
  ),
  requestValidators.validarCrearDetallePedido,
  detallePedidoController.crear,
);

router.put(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.PEDIDOS_EDITAR,
  ),
  requestValidators.validarIdParam,
  requestValidators.validarActualizarDetallePedido,
  detallePedidoController.actualizar,
);

router.delete(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.PEDIDOS_EDITAR,
  ),
  requestValidators.validarIdParam,
  detallePedidoController.eliminar,
);

export default router;
