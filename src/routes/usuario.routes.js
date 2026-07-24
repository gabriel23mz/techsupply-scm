import {
  Router,
} from 'express';

import * as usuarioController
  from '../controllers/usuario.controller.js';

import * as requestValidators
  from '../middlewares/requestValidators.js';

const router = Router();

router.get(
  '/',
  usuarioController.obtenerTodos,
);

router.get(
  '/:id',
  requestValidators.validarIdParam,
  usuarioController.obtenerPorId,
);

router.post(
  '/',
  requestValidators.validarCrearUsuario,
  usuarioController.crear,
);

router.put(
  '/:id',
  requestValidators.validarIdParam,
  requestValidators.validarActualizarUsuario,
  usuarioController.actualizar,
);

router.delete(
  '/:id',
  requestValidators.validarIdParam,
  usuarioController.eliminar,
);

export default router;
