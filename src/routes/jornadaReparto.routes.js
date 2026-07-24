import {
  Router,
} from 'express';

import * as jornadaRepartoController
  from '../controllers/jornadaReparto.controller.js';

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
    PERMISSIONS.JORNADAS_LEER,
  ),
  jornadaRepartoController.obtenerJornadas,
);

router.get(
  '/mapa-general',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.JORNADAS_LEER,
  ),
  jornadaRepartoController.obtenerMapaGeneral,
);

router.get(
  '/mis-jornadas',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.JORNADAS_LEER,
  ),
  jornadaRepartoController.obtenerMisJornadas,
);

router.get(
  '/:id',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.JORNADAS_LEER,
  ),
  requestValidators.validarIdParam,
  jornadaRepartoController.obtenerJornadaPorId,
);

router.post(
  '/generar',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.JORNADAS_GENERAR,
  ),
  jornadaRepartoController.generarJornadaReparto,
);

router.patch(
  '/:id/recalcular',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.JORNADAS_RECALCULAR,
  ),
  requestValidators.validarIdParam,
  jornadaRepartoController.recalcularJornada,
);

router.patch(
  '/:id/asignar-chofer',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.JORNADAS_ASIGNAR_CHOFER,
  ),
  requestValidators.validarIdParam,
  requestValidators.validarAsignarChofer,
  jornadaRepartoController.asignarChofer,
);

router.patch(
  '/:id/iniciar',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.JORNADAS_INICIAR,
  ),
  requestValidators.validarIdParam,
  jornadaRepartoController.iniciarJornada,
);

router.patch(
  '/:id/avanzar',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.JORNADAS_INICIAR,
  ),
  requestValidators.validarIdParam,
  jornadaRepartoController.avanzarJornada,
);

router.patch(
  '/:id/finalizar',
  authorizationMiddleware.requirePermission(
    PERMISSIONS.JORNADAS_FINALIZAR,
  ),
  requestValidators.validarIdParam,
  jornadaRepartoController.finalizarJornada,
);

export default router;
