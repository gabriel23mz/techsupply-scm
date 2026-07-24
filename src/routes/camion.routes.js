import {
  Router,
} from 'express';

import * as camionController
  from '../controllers/camion.controller.js';

import * as requestValidators
  from '../middlewares/requestValidators.js';

const router = Router();

router.get(
  '/',
  camionController.obtenerTodos,
);

router.get(
  '/:id',
  requestValidators.validarIdParam,
  camionController.obtenerPorId,
);

export default router;
