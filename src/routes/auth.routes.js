import {
  Router,
} from 'express';

import * as authController
  from '../controllers/auth.controller.js';

import * as authMiddleware
  from '../middlewares/auth.middleware.js';

import * as requestValidators
  from '../middlewares/requestValidators.js';

const router = Router();

router.post(
  '/login',
  requestValidators.validarLogin,
  authController.login,
);

router.get(
  '/me',
  authMiddleware.requireAuth,
  authController.me,
);

export default router;
