import api from '../../../shared/services/api';

import {
  SESSION_STORAGE_KEY,
} from '../../../shared/constants/storage';

export const SESSION_KEY = SESSION_STORAGE_KEY;

function unwrap(response) {
  return (
    response?.data?.data ??
    response?.data ??
    null
  );
}

export function normalizeSession(data, tokenFallback = null) {
  if (!data) {
    return null;
  }

  const user = data.user ?? data.usuario ?? null;
  const token = data.token ?? tokenFallback ?? null;
  const permissions =
    data.permissions ??
    data.permisos ??
    [];

  if (!user || !token) {
    return null;
  }

  return {
    ...data,
    user,
    token,
    permissions:
      Array.isArray(permissions)
        ? [...new Set(permissions)]
        : [],
  };
}

export const iniciarSesion = async ({
  correo,
  password,
}) => {
  const response = await api.post(
    '/auth/login',
    {
      correo,
      password,
    },
  );

  const session = normalizeSession(
    unwrap(response),
  );

  if (!session) {
    throw new Error(
      'El servidor no devolvió una sesión válida.',
    );
  }

  return session;
};

export const obtenerSesionActual = async ({
  token,
  signal,
} = {}) => {
  const response = await api.get(
    '/auth/me',
    {
      signal,
      headers: token
        ? {
          Authorization: `Bearer ${token}`,
        }
        : undefined,
    },
  );

  const session = normalizeSession(
    unwrap(response),
    token,
  );

  if (!session) {
    throw new Error(
      'El servidor no devolvió una sesión válida.',
    );
  }

  return session;
};

export const obtenerSesionLocal = () => {
  try {
    const raw = localStorage.getItem(
      SESSION_KEY,
    );

    const session = raw
      ? normalizeSession(JSON.parse(raw))
      : null;

    if (!session) {
      localStorage.removeItem(SESSION_KEY);
    }

    return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const guardarSesionLocal = (
  session,
) => {
  const normalized = normalizeSession(session);

  if (!normalized) {
    limpiarSesionLocal();
    return;
  }

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(normalized),
  );
};

export const limpiarSesionLocal = () => {
  localStorage.removeItem(
    SESSION_KEY,
  );
};
