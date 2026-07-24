import {
  Router,
} from 'express';

import * as jornadaRepartoController
  from '../controllers/jornadaReparto.controller.js';

import * as requestValidators
  from '../middlewares/requestValidators.js';

const router = Router();

router.get(
  '/',
  jornadaRepartoController.obtenerJornadas,
);

router.get(
  '/mapa-general',
  jornadaRepartoController.obtenerMapaGeneral,
);

router.get(
  '/:id',
  requestValidators.validarIdParam,
  jornadaRepartoController.obtenerJornadaPorId,
);

router.post(
  '/generar',
  jornadaRepartoController.generarJornadaReparto,
);

router.patch(
  '/:id/recalcular',
  requestValidators.validarIdParam,
  jornadaRepartoController.recalcularJornada,
);

router.patch(
  '/:id/iniciar',
  requestValidators.validarIdParam,
  jornadaRepartoController.iniciarJornada,
);

router.patch(
  '/:id/avanzar',
  requestValidators.validarIdParam,
  jornadaRepartoController.avanzarJornada,
);

router.patch(
  '/:id/finalizar',
  requestValidators.validarIdParam,
  jornadaRepartoController.finalizarJornada,
);

export default router;
