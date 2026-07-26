import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  guardarSesionLocal,
  iniciarSesion,
  limpiarSesionLocal,
  obtenerSesionActual,
  obtenerSesionLocal,
} from '../../modules/auth/services/auth.service';

import {
  SESSION_EXPIRED_EVENT,
} from '../services/api';

import AuthContext from './auth-context';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(
    obtenerSesionLocal,
  );

  const [isAuthenticating, setIsAuthenticating] =
    useState(false);

  const [isSessionLoading, setIsSessionLoading] =
    useState(true);

  const [sessionError, setSessionError] =
    useState(null);

  const clearSession = useCallback(() => {
    setSession(null);
    limpiarSesionLocal();
  }, []);

  useEffect(() => {
    if (session) {
      guardarSesionLocal(session);
    } else {
      limpiarSesionLocal();
    }
  }, [session]);

  const sessionToken = session?.token ?? null;

  useEffect(() => {
    const controller = new AbortController();

    async function validateStoredSession() {
      if (!sessionToken) {
        setIsSessionLoading(false);
        return;
      }

      try {
        setIsSessionLoading(true);
        setSessionError(null);

        const validatedSession =
          await obtenerSesionActual({
            token: sessionToken,
            signal: controller.signal,
          });

        setSession(validatedSession);
      } catch (error) {
        if (
          error?.code === 'ERR_CANCELED' ||
          error?.name === 'CanceledError'
        ) {
          return;
        }

        setSessionError(error);
        clearSession();
      } finally {
        if (!controller.signal.aborted) {
          setIsSessionLoading(false);
        }
      }
    }

    void validateStoredSession();

    return () => controller.abort();
  }, [clearSession, sessionToken]);

  useEffect(() => {
    const handleSessionExpired = (event) => {
      setSessionError({
        code:
          event?.detail?.code ??
          'SESSION_EXPIRED',
        message:
          event?.detail?.message ??
          'La sesión expiró.',
      });

      clearSession();
      setIsSessionLoading(false);
    };

    window.addEventListener(
      SESSION_EXPIRED_EVENT,
      handleSessionExpired,
    );

    return () => {
      window.removeEventListener(
        SESSION_EXPIRED_EVENT,
        handleSessionExpired,
      );
    };
  }, [clearSession]);

  const login = useCallback(
    async (credentials) => {
      try {
        setIsAuthenticating(true);
        setSessionError(null);

        const nextSession =
          await iniciarSesion(credentials);

        setSession(nextSession);

        return nextSession;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [],
  );

  const refreshSession = useCallback(
    async () => {
      if (!sessionToken) {
        clearSession();
        return null;
      }

      try {
        setIsSessionLoading(true);
        setSessionError(null);

        const nextSession =
          await obtenerSesionActual({
            token: sessionToken,
          });

        setSession(nextSession);

        return nextSession;
      } catch (error) {
        setSessionError(error);
        clearSession();
        throw error;
      } finally {
        setIsSessionLoading(false);
      }
    },
    [clearSession, sessionToken],
  );

  const logout = useCallback(() => {
    setSessionError(null);
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => {
      const permissions =
        Array.isArray(session?.permissions)
          ? session.permissions
          : [];

      return {
        user: session?.user ?? null,
        token: sessionToken,
        permissions,
        hasPermission: (permission) =>
          !permission ||
          permissions.includes(permission),
        isAuthenticated: Boolean(
          session?.user &&
          sessionToken,
        ),
        isAuthenticating,
        isSessionLoading,
        sessionError,
        login,
        logout,
        refreshSession,
      };
    },
    [
      isAuthenticating,
      isSessionLoading,
      login,
      logout,
      refreshSession,
      session,
      sessionError,
      sessionToken,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
