import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  iniciarSesion,
  obtenerSesionLocal,
  guardarSesionLocal,
  limpiarSesionLocal,
} from '../../modules/auth/services/auth.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() =>
    obtenerSesionLocal(),
  );

  const [isAuthenticating, setIsAuthenticating] =
    useState(false);

  useEffect(() => {
    if (session) {
      guardarSesionLocal(session);
    } else {
      limpiarSesionLocal();
    }
  }, [session]);

  const login = async (credentials) => {
    try {
      setIsAuthenticating(true);

      const nextSession =
        await iniciarSesion(credentials);

      setSession(nextSession);

      return nextSession;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = () => {
    setSession(null);
  };

  const value = useMemo(
    () => {
      const permissions =
        session?.permissions ??
        session?.permisos ??
        [];

      return ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      permissions,
      hasPermission: (permission) =>
        !permission ||
        permissions.includes(permission),
      isAuthenticated: Boolean(
        session?.user,
      ),
      isAuthenticating,
      login,
      logout,
    });
    },
    [
      isAuthenticating,
      session,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider',
    );
  }

  return context;
}

export default AuthContext;
