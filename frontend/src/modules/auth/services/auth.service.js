import api from '../../../shared/services/api';

const SESSION_KEY =
  'techsupply_session';

function unwrap(response) {
  return (
    response?.data?.data ??
    response?.data ??
    null
  );
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

  const data = unwrap(response);

  if (!data?.user || !data?.token) {
    throw new Error(
      'El servidor no devolvió una sesión válida.',
    );
  }

  return data;
};

export const obtenerSesionLocal = () => {
  try {
    const raw = localStorage.getItem(
      SESSION_KEY,
    );

    return raw
      ? JSON.parse(raw)
      : null;
  } catch {
    return null;
  }
};

export const guardarSesionLocal = (
  session,
) => {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(session),
  );
};

export const limpiarSesionLocal = () => {
  localStorage.removeItem(
    SESSION_KEY,
  );
};
