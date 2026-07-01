import { Router } from 'express';

import * as despachoController from '../controllers/despacho.controller.js';

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
  despachoController.obtenerPorId,
);

router.post(
  '/',
  despachoController.crear,
);

router.patch(
  '/:id/iniciar',
  despachoController.iniciar,
);

router.patch(
  '/:id/entregar',
  despachoController.entregar,
);

router.patch(
  '/:id/cancelar',
  despachoController.cancelar,
);

export default router;
