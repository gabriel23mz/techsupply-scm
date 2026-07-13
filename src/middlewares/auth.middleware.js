import {
  errorResponse,
} from '../utils/apiResponse.js';

import {
  verifyAuthToken,
} from '../utils/authToken.js';

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
      return errorResponse(
        res,
        'Autenticación requerida',
        401,
      );
    }

    req.auth =
      verifyAuthToken(token);

    return next();
  } catch (error) {
    return errorResponse(
      res,
      error.message,
      401,
    );
  }
}
