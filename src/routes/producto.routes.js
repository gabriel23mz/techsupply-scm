import {
  Router,
} from 'express';

import * as productoController
  from '../controllers/producto.controller.js';

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
    PERMISSIONS.CATALOGO_LEER,
  ),
  productoController.obtenerTodos,
);

router.get(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CATALOGO_LEER,
  ),
  requestValidators.validarIdParam,
  productoController.obtenerPorId,
);

router.post(
  '/',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CATALOGO_GESTIONAR,
  ),
  requestValidators.validarCrearProducto,
  productoController.crear,
);

router.put(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CATALOGO_GESTIONAR,
  ),
  requestValidators.validarIdParam,
  requestValidators.validarActualizarProducto,
  productoController.actualizar,
);

router.delete(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CATALOGO_GESTIONAR,
  ),
  requestValidators.validarIdParam,
  productoController.eliminar,
);

export default router;
