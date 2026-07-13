import bcrypt from 'bcrypt';

import Usuario from '../models/Usuario.js';

import {
  createAuthToken,
} from '../utils/authToken.js';

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
    throw new Error(
      'Correo o contraseña incorrectos',
    );
  }

  const validPassword =
    await bcrypt.compare(
      String(password ?? ''),
      usuario.password_hash,
    );

  if (!validPassword) {
    throw new Error(
      'Correo o contraseña incorrectos',
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

    return usuario;
  };
