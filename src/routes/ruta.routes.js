import {
  Router,
} from 'express';

import * as rutaController
  from '../controllers/ruta.controller.js';

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
    PERMISSIONS.RUTAS_LEER,
  ),
  rutaController.obtenerTodas,
);

router.get(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.RUTAS_LEER,
  ),
  requestValidators.validarIdParam,
  rutaController.obtenerPorId,
);

router.post(
  '/',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.RUTAS_GESTIONAR,
  ),
  requestValidators.validarCrearRuta,
  rutaController.crear,
);

router.put(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.RUTAS_GESTIONAR,
  ),
  requestValidators.validarIdParam,
  requestValidators.validarActualizarRuta,
  rutaController.actualizar,
);

router.delete(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.RUTAS_GESTIONAR,
  ),
  requestValidators.validarIdParam,
  rutaController.eliminar,
);

export default router;
