import {
  hasPermission,
} from '../constants/permissions.js';

import {
  ForbiddenError,
  UnauthorizedError,
} from '../utils/errors.js';

export const requirePermission =
  (permission) =>
    (req, res, next) => {
      try {
        if (!req.user) {
          throw new UnauthorizedError(
            'Autenticación requerida',
            'AUTH_REQUERIDA',
          );
        }

        if (
          !hasPermission(
            req.user.rol,
            permission,
          )
        ) {
          throw new ForbiddenError(
            'No posee permisos para realizar esta acción',
            'PERMISO_DENEGADO',
          );
        }

        return next();
      } catch (error) {
        return next(error);
      }
    };
