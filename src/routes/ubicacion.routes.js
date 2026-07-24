import {
  Router,
} from 'express';

import * as ubicacionController
  from '../controllers/ubicacion.controller.js';

import * as requestValidators
  from '../middlewares/requestValidators.js';

const router = Router();

router.get(
  '/',
  ubicacionController.obtenerTodas,
);

router.get(
  '/:id',
  requestValidators.validarIdParam,
  ubicacionController.obtenerPorId,
);

router.post(
  '/',
  requestValidators.validarCrearUbicacion,
  ubicacionController.crear,
);

router.put(
  '/:id',
  requestValidators.validarIdParam,
  requestValidators.validarActualizarUbicacion,
  ubicacionController.actualizar,
);

router.delete(
  '/:id',
  requestValidators.validarIdParam,
  ubicacionController.eliminar,
);

export default router;
