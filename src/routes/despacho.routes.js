import {
  Router,
} from 'express';

import * as despachoController
  from '../controllers/despacho.controller.js';

import * as requestValidators
  from '../middlewares/requestValidators.js';

const router = Router();

router.get(
  '/',
  despachoController.obtenerTodos,
);

router.get(
  '/pedidos-disponibles',
  despachoController.obtenerPedidosDisponibles,
);

router.get(
  '/:id',
  requestValidators.validarIdParam,
  despachoController.obtenerPorId,
);

router.post(
  '/',
  requestValidators.validarCrearDespacho,
  despachoController.crear,
);

router.patch(
  '/:id/iniciar',
  requestValidators.validarIdParam,
  despachoController.iniciar,
);

router.patch(
  '/:id/entregar',
  requestValidators.validarIdParam,
  despachoController.entregarDespacho,
);

router.patch(
  '/:id/no-entregado',
  requestValidators.validarIdParam,
  despachoController.marcarNoEntregado,
);

router.patch(
  '/:id/cancelar',
  requestValidators.validarIdParam,
  despachoController.cancelar,
);

export default router;
