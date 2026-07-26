import {
  Router,
} from 'express';

import * as dashboardController
  from '../controllers/dashboard.controller.js';

import * as authMiddleware
  from '../middlewares/auth.middleware.js';

const router = Router();

router.use(
  authMiddleware.requireAuth,
);

router.get(
  '/resumen',
  dashboardController.obtenerResumen,
);

router.get(
  '/notificaciones',
  dashboardController.obtenerNotificaciones,
);

export default router;
