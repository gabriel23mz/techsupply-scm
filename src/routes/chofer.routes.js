import {
  Router,
} from 'express';

import * as choferController
  from '../controllers/chofer.controller.js';

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
    PERMISSIONS.CHOFERES_LEER,
  ),
  choferController.obtenerTodos,
);

router.get(
  '/disponibles',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CHOFERES_LEER,
  ),
  choferController.obtenerDisponibles,
);

router.post(
  '/',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CHOFERES_GESTIONAR,
  ),
  requestValidators.validarCrearChofer,
  choferController.crear,
);

router.get(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CHOFERES_LEER,
  ),
  requestValidators.validarIdParam,
  choferController.obtenerPorId,
);

router.put(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CHOFERES_GESTIONAR,
  ),
  requestValidators.validarIdParam,
  requestValidators.validarActualizarChofer,
  choferController.actualizar,
);

router.delete(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CHOFERES_GESTIONAR,
  ),
  requestValidators.validarIdParam,
  choferController.eliminar,
);

export default router;
