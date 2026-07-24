import {
  verifyAuthToken,
} from '../utils/authToken.js';

import Usuario from '../models/Usuario.js';

import {
  UnauthorizedError,
} from '../utils/errors.js';

export async function requireAuth(
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

    const auth =
      verifyAuthToken(token);

    const usuario =
      await Usuario.findOne({
        where: {
          id: auth.sub,
          estado: true,
        },
        attributes: {
          exclude: ['password_hash'],
        },
      });

    if (!usuario) {
      throw new UnauthorizedError(
        'Usuario autenticado no disponible',
        'USUARIO_SESION_INVALIDO',
      );
    }

    req.auth = {
      ...auth,
      rol: usuario.rol,
    };

    req.user = usuario.toJSON
      ? usuario.toJSON()
      : usuario;

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
