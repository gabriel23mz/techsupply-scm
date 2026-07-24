import {
  Router,
} from 'express';

import * as ubicacionController
  from '../controllers/ubicacion.controller.js';

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
    PERMISSIONS.UBICACIONES_LEER,
  ),
  ubicacionController.obtenerTodas,
);

router.get(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.UBICACIONES_LEER,
  ),
  requestValidators.validarIdParam,
  ubicacionController.obtenerPorId,
);

router.post(
  '/',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.UBICACIONES_GESTIONAR,
  ),
  requestValidators.validarCrearUbicacion,
  ubicacionController.crear,
);

router.put(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.UBICACIONES_GESTIONAR,
  ),
  requestValidators.validarIdParam,
  requestValidators.validarActualizarUbicacion,
  ubicacionController.actualizar,
);

router.delete(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.UBICACIONES_GESTIONAR,
  ),
  requestValidators.validarIdParam,
  ubicacionController.eliminar,
);

export default router;
