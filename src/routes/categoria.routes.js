import {
  Router,
} from 'express';

import * as categoriaController
  from '../controllers/categoria.controller.js';

import * as requestValidators
  from '../middlewares/requestValidators.js';

const router = Router();

router.get(
  '/',
  categoriaController.obtenerTodas,
);

router.get(
  '/:id',
  requestValidators.validarIdParam,
  categoriaController.obtenerPorId,
);

router.post(
  '/',
  requestValidators.validarCrearCategoria,
  categoriaController.crear,
);

router.put(
  '/:id',
  requestValidators.validarIdParam,
  requestValidators.validarActualizarCategoria,
  categoriaController.actualizar,
);

router.delete(
  '/:id',
  requestValidators.validarIdParam,
  categoriaController.eliminar,
);

export default router;
