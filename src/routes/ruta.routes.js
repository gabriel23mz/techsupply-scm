import {
  Router,
} from 'express';

import * as rutaController
  from '../controllers/ruta.controller.js';

import * as requestValidators
  from '../middlewares/requestValidators.js';

const router = Router();

router.get(
  '/',
  rutaController.obtenerTodas,
);

router.get(
  '/:id',
  requestValidators.validarIdParam,
  rutaController.obtenerPorId,
);

router.post(
  '/',
  requestValidators.validarCrearRuta,
  rutaController.crear,
);

router.put(
  '/:id',
  requestValidators.validarIdParam,
  requestValidators.validarActualizarRuta,
  rutaController.actualizar,
);

router.delete(
  '/:id',
  requestValidators.validarIdParam,
  rutaController.eliminar,
);

export default router;
