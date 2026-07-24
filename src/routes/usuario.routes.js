import {
  Router,
} from 'express';

import * as usuarioController
  from '../controllers/usuario.controller.js';

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
    PERMISSIONS.USUARIOS_GESTIONAR,
  ),
  usuarioController.obtenerTodos,
);

router.get(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.USUARIOS_GESTIONAR,
  ),
  requestValidators.validarIdParam,
  usuarioController.obtenerPorId,
);

router.post(
  '/',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.USUARIOS_GESTIONAR,
  ),
  requestValidators.validarCrearUsuario,
  usuarioController.crear,
);

router.put(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.USUARIOS_GESTIONAR,
  ),
  requestValidators.validarIdParam,
  requestValidators.validarActualizarUsuario,
  usuarioController.actualizar,
);

router.delete(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.USUARIOS_GESTIONAR,
  ),
  requestValidators.validarIdParam,
  usuarioController.eliminar,
);

export default router;
