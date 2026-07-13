import axios from 'axios';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ??
    'http://localhost:3000/api',
  timeout: 90000,
  headers: {
    'Content-Type':
      'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    try {
      const raw =
        localStorage.getItem(
          'techsupply_session',
        );

      const session = raw
        ? JSON.parse(raw)
        : null;

      if (session?.token) {
        config.headers.Authorization =
          `Bearer ${session.token}`;
      }
    } catch {
      // La petición continúa sin token.
    }

    return config;
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      'Error de comunicación con el servidor';

    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes(
        '/auth/login',
      )
    ) {
      localStorage.removeItem(
        'techsupply_session',
      );

      if (
        window.location.pathname !==
        '/login'
      ) {
        window.location.assign(
          '/login',
        );
      }
    }

    return Promise.reject(
      new Error(message),
    );
  },
);

export default api;
