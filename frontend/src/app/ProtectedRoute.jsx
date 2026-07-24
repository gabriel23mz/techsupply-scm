import {
  Navigate,
  useLocation,
} from 'react-router-dom';

import {
  useAuth,
} from '../shared/contexts/AuthContext';

function ProtectedRoute({
  children,
  requiredPermission,
}) {
  const location = useLocation();

  const {
    hasPermission,
    isAuthenticated,
  } = useAuth();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  if (
    requiredPermission &&
    !hasPermission(requiredPermission)
  ) {
    return (
      <main className="app-content">
        <section className="pedidos-empty">
          <i className="bi bi-shield-lock" />
          <h4>
            Acceso denegado
          </h4>
          <p>
            Tu usuario no tiene permiso para consultar esta sección.
          </p>
        </section>
      </main>
    );
  }

  return children;
}

export default ProtectedRoute;
