import {
  Router,
} from 'express';

import * as bodegaController
  from '../controllers/bodega.controller.js';

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
  '/pedidos',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.PEDIDOS_PREPARAR,
  ),
  bodegaController.obtenerPedidosPreparacion,
);

router.get(
  '/pedidos/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.PEDIDOS_PREPARAR,
  ),
  requestValidators.validarIdParam,
  bodegaController.obtenerPedidoPreparacion,
);

router.patch(
  '/detalles/:id/preparacion',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.PEDIDOS_PREPARAR,
  ),
  requestValidators.validarIdParam,
  requestValidators.validarActualizarPreparacionDetalle,
  bodegaController.actualizarPreparacionDetalle,
);

router.patch(
  '/pedidos/:id/finalizar-preparacion',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.PEDIDOS_FINALIZAR_PREPARACION,
  ),
  requestValidators.validarIdParam,
  bodegaController.finalizarPreparacion,
);

router.get(
  '/jornadas',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CARGAS_LEER,
  ),
  bodegaController.obtenerJornadasCarga,
);

router.get(
  '/jornadas/:id/carga',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CARGAS_LEER,
  ),
  requestValidators.validarIdParam,
  bodegaController.obtenerJornadaCarga,
);

router.patch(
  '/despachos/:id/carga',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CARGAS_ACTUALIZAR,
  ),
  requestValidators.validarIdParam,
  requestValidators.validarActualizarCargaDespacho,
  bodegaController.actualizarCargaDespacho,
);

router.patch(
  '/jornadas/:id/confirmar-carga',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.CARGAS_CONFIRMAR,
  ),
  requestValidators.validarIdParam,
  bodegaController.confirmarCargaJornada,
);

export default router;
