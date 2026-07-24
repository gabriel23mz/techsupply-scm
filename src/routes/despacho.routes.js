import {
  Router,
} from 'express';

import * as despachoController
  from '../controllers/despacho.controller.js';

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
    PERMISSIONS.DESPACHOS_LEER,
  ),
  despachoController.obtenerTodos,
);

router.get(
  '/pedidos-disponibles',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.JORNADAS_GENERAR,
  ),
  despachoController.obtenerPedidosDisponibles,
);

router.get(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.DESPACHOS_LEER,
  ),
  requestValidators.validarIdParam,
  despachoController.obtenerPorId,
);

router.post(
  '/',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.DESPACHOS_CANCELAR,
  ),
  requestValidators.validarCrearDespacho,
  despachoController.crear,
);

router.patch(
  '/:id/iniciar',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.DESPACHOS_CANCELAR,
  ),
  requestValidators.validarIdParam,
  despachoController.iniciar,
);

router.patch(
  '/:id/entregar',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.DESPACHOS_ENTREGAR,
  ),
  requestValidators.validarIdParam,
  despachoController.entregarDespacho,
);

router.patch(
  '/:id/no-entregado',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.DESPACHOS_NO_ENTREGAR,
  ),
  requestValidators.validarIdParam,
  despachoController.marcarNoEntregado,
);

router.patch(
  '/:id/cancelar',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.DESPACHOS_CANCELAR,
  ),
  requestValidators.validarIdParam,
  despachoController.cancelar,
);

export default router;
