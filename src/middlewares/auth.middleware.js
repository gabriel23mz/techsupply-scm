import {
  verifyAuthToken,
} from '../utils/authToken.js';

import {
  UnauthorizedError,
} from '../utils/errors.js';

export function requireAuth(
  req,
  res,
  next,
) {
  try {
    const authorization =
      req.headers.authorization ??
      '';

    const [
      scheme,
      token,
    ] = authorization.split(' ');

    if (
      scheme !== 'Bearer' ||
      !token
    ) {
      throw new UnauthorizedError(
        'Autenticación requerida',
        'AUTH_REQUERIDA',
      );
    }

    req.auth =
      verifyAuthToken(token);

    return next();
  } catch (error) {
    return next(
      error instanceof UnauthorizedError
        ? error
        : new UnauthorizedError(
      error.message,
          'TOKEN_INVALIDO',
        ),
    );
  }
}
