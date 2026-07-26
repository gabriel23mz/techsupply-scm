import axios from 'axios';

import {
  SESSION_STORAGE_KEY,
} from '../constants/storage';

import {
  createApiError,
} from './ApiError';

export const SESSION_EXPIRED_EVENT =
  'techsupply:session-expired';

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
          SESSION_STORAGE_KEY,
        );

      const session = raw
        ? JSON.parse(raw)
        : null;

      if (
        session?.token &&
        !config.headers?.Authorization
      ) {
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
    const apiError =
      createApiError(error);

    const isLoginRequest =
      error?.config?.url?.includes(
        '/auth/login',
      );

    if (
      apiError.status === 401 &&
      !isLoginRequest
    ) {
      window.dispatchEvent(
        new CustomEvent(
          SESSION_EXPIRED_EVENT,
          {
            detail: {
              code: apiError.code,
              message: apiError.message,
            },
          },
        ),
      );
    }

    return Promise.reject(apiError);
  },
);

export default api;
