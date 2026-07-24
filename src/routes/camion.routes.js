import {
  Router,
} from 'express';

import * as camionController
  from '../controllers/camion.controller.js';

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
    PERMISSIONS.CAMIONES_LEER,
  ),
  camionController.obtenerTodos,
);

router.get(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CAMIONES_LEER,
  ),
  requestValidators.validarIdParam,
  camionController.obtenerPorId,
);

router.post(
  '/',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CAMIONES_GESTIONAR,
  ),
  requestValidators.validarCrearCamion,
  camionController.crear,
);

router.put(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CAMIONES_GESTIONAR,
  ),
  requestValidators.validarIdParam,
  requestValidators.validarActualizarCamion,
  camionController.actualizar,
);

router.delete(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CAMIONES_GESTIONAR,
  ),
  requestValidators.validarIdParam,
  camionController.eliminar,
);

export default router;
