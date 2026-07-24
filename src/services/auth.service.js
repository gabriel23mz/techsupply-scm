import bcrypt from 'bcrypt';

import Usuario from '../models/Usuario.js';

import {
  createAuthToken,
} from '../utils/authToken.js';

import {
  NotFoundError,
  UnauthorizedError,
} from '../utils/errors.js';

function sanitizeUser(usuario) {
  const plain =
    typeof usuario.toJSON ===
    'function'
      ? usuario.toJSON()
      : usuario;

  const {
    password_hash,
    ...safeUser
  } = plain;

  return safeUser;
}

export const login = async ({
  correo,
  password,
}) => {
  const normalizedEmail =
    String(correo ?? '')
      .trim()
      .toLowerCase();

  const usuario =
    await Usuario.findOne({
      where: {
        correo:
          normalizedEmail,
      },
    });

  if (
    !usuario ||
    usuario.estado === false
  ) {
    throw new UnauthorizedError(
      'Correo o contraseña incorrectos',
      'CREDENCIALES_INVALIDAS',
    );
  }

  const validPassword =
    await bcrypt.compare(
      String(password ?? ''),
      usuario.password_hash,
    );

  if (!validPassword) {
    throw new UnauthorizedError(
      'Correo o contraseña incorrectos',
      'CREDENCIALES_INVALIDAS',
    );
  }

  const user =
    sanitizeUser(usuario);

  return {
    user,
    token:
      createAuthToken(user),
    expires_in: 43200,
  };
};

export const obtenerUsuarioSesion =
  async (id) => {
    const usuario =
      await Usuario.findOne({
        where: {
          id,
          estado: true,
        },
        attributes: {
          exclude: [
            'password_hash',
          ],
        },
      });

    if (!usuario) {
      throw new NotFoundError(
        'Usuario no encontrado',
        'USUARIO_NO_ENCONTRADO',
      );
    }

    return usuario;
  };
